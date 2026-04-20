import React from 'react';
import { Home, Package, ShoppingBag, Users, MoreHorizontal, CreditCard } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: 'admin' | 'kasir';
}

export default function Navigation({ activeTab, setActiveTab, userRole = 'admin' }: NavigationProps) {
  const allTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'orders', label: 'Pesanan', icon: Package },
    { id: 'catalog', label: 'Katalog', icon: ShoppingBag },
    { id: 'debts', label: 'Hutang', icon: CreditCard },
    { id: 'more', label: 'Lainnya', icon: MoreHorizontal },
  ];

  const tabs = userRole === 'kasir' 
    ? allTabs.filter(t => ['home', 'debts', 'more'].includes(t.id))
    : allTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl px-2 py-4 flex justify-around items-center z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.03)] border-t border-black/5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-300 ${
              isActive ? 'text-primary scale-110' : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <div className={`p-2 md:p-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
              <Icon className={`w-5 h-5 md:w-6 md:h-6 transition-all ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            </div>
            <span className={`text-[9px] mt-1 font-bold uppercase tracking-widest ${isActive ? 'text-primary opacity-100' : 'text-gray-300 opacity-0'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
