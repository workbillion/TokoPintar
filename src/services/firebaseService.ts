import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes undefined values from an object or array.
 * Firestore does not support undefined values.
 */
const sanitize = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => sanitize(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitize(v)])
    );
  }
  return obj;
};

export const FirebaseService = {
  async syncToCloud(userId: string, data: any) {
    if (!db) return null;

    const { products, orders, customers, expenses, reminders, notifications, debts, config, deleted } = data;

    try {
      const ops: { type: 'set' | 'delete', ref: any, data?: any }[] = [];

      // Add Config
      if (config) {
        ops.push({
          type: 'set',
          ref: doc(db, 'users', userId, 'config', 'main'),
          data: { ...sanitize(config), updatedAt: new Date().toISOString() }
        });
      }

      // Deletions first
      if (deleted) {
        const deletions = Array.isArray(deleted) ? deleted : [deleted];
        deletions.forEach(d => {
          ops.push({
            type: 'delete',
            ref: doc(db, 'users', userId, d.path, d.id)
          });
          // Special case for products: also delete images
          if (d.path === 'products') {
            ops.push({
              type: 'delete',
              ref: doc(db, 'users', userId, 'images', d.id)
            });
          }
        });
      }

      // Collect all ops
      const collectOps = (subpath: string, items: any[]) => {
        if (!items) return;
        items.forEach(item => {
          const itemToSave = { ...item };
          if (subpath === 'products' && itemToSave.image && itemToSave.image.startsWith('data:image')) {
            itemToSave.image = 'cloud-sync';
          }
          ops.push({
            type: 'set',
            ref: doc(db, 'users', userId, subpath, item.id),
            data: { ...sanitize(itemToSave), updatedAt: new Date().toISOString() }
          });
        });
      };

      collectOps('products', products);
      collectOps('orders', orders);
      collectOps('customers', customers);
      collectOps('expenses', expenses);
      collectOps('reminders', reminders);
      collectOps('notifications', notifications);
      collectOps('debts', debts);

      // Images ops
      if (products) {
        products.forEach((p: any) => {
          if (p.image && p.image.startsWith('data:image')) {
            ops.push({
              type: 'set',
              ref: doc(db, 'users', userId, 'images', p.id),
              data: { id: p.id, data: p.image, updatedAt: new Date().toISOString() }
            });
          }
        });
      }

      // Commit in batches of 400 (safe limit is 500)
      for (let i = 0; i < ops.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = ops.slice(i, i + 400);
        chunk.forEach(op => {
          if (op.type === 'set') {
            batch.set(op.ref, op.data, { merge: true });
          } else {
            batch.delete(op.ref);
          }
        });
        await batch.commit();
      }

      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
      return false;
    }
  },

  async clearCloud(userId: string) {
    if (!db) return false;
    try {
      const collections = ['products', 'orders', 'customers', 'expenses', 'reminders', 'notifications', 'debts', 'images'];
      const batch = writeBatch(db);
      
      for (const col of collections) {
        const colRef = collection(db, 'users', userId, col);
        const snapshot = await getDocs(colRef);
        snapshot.docs.forEach(d => batch.delete(d.ref));
      }
      
      // Also clear config
      batch.delete(doc(db, 'users', userId, 'config', 'main'));
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error clearing cloud data:', error);
      return false;
    }
  },

  async pullFromCloud(userId: string) {
    if (!db) return null;

    try {
      const fetchCollection = async (subpath: string) => {
        const path = `users/${userId}/${subpath}`;
        try {
          const colRef = collection(db, 'users', userId, subpath);
          const snapshot = await getDocs(colRef);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
          console.warn(`Failed to fetch ${subpath}:`, error);
          return [];
        }
      };

      // Fetch everything in parallel but handle individual failures
      const [products, orders, customers, expenses, reminders, notifications, debts, images, configDoc] = await Promise.all([
        fetchCollection('products'),
        fetchCollection('orders'),
        fetchCollection('customers'),
        fetchCollection('expenses'),
        fetchCollection('reminders'),
        fetchCollection('notifications'),
        fetchCollection('debts'),
        fetchCollection('images'),
        (async () => {
          try {
            return await getDoc(doc(db, 'users', userId, 'config', 'main'));
          } catch (error) {
            console.warn('Failed to fetch config:', error);
            return null;
          }
        })()
      ]);

      // Map images back to products if they are stored separately
      const productsWithImages = products.map((p: any) => {
        const img = images.find((i: any) => i.id === p.id) as any;
        if (img) return { ...p, image: img.data };
        return p;
      });

      return {
        products: productsWithImages,
        orders,
        customers,
        expenses,
        reminders,
        notifications,
        debts,
        config: configDoc && 'exists' in configDoc && configDoc.exists() ? configDoc.data() : (configDoc && !('exists' in configDoc) ? configDoc : null)
      };
    } catch (error) {
      console.error('Error pulling from Firebase:', error);
      return null;
    }
  },

  async pullPublicStore(userId: string) {
    if (!db) return null;

    try {
      const productsRef = collection(db, 'users', userId, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const imagesRef = collection(db, 'users', userId, 'images');
      const imagesSnapshot = await getDocs(imagesRef);
      const configRef = doc(db, 'users', userId, 'config', 'main');
      const configDoc = await getDoc(configRef);

      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const images = imagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Map images back to products
      const productsWithImages = products.map((p: any) => {
        const img = images.find((i: any) => i.id === p.id) as any;
        if (img) return { ...p, image: img.data };
        return p;
      });

      return {
        products: productsWithImages,
        config: configDoc.exists() ? configDoc.data() : null
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/public`);
      return null;
    }
  },

  async testConnection() {
    if (!isFirebaseConfigured || !db) return;
    try {
      // Test connection to Firestore
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. The client is offline.");
      }
      // Skip logging for other errors, as this is simply a connection test.
    }
  }
};
