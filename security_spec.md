# Security Specification for TokoPintar

## Data Invariants
1. A Product must belong to a valid User (Owner).
2. An Order must contain a valid total amount and status.
3. Users can only access their own data, except for public store metadata and products which are readable by anyone (for the mini-store feature).
4. IDs must be valid alphanumeric strings.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a product for another user's ID.
2. **Identity Spoofing (Update)**: Attempt to change the owner ID of a document.
3. **Ghost Fields**: Attempt to add `isAdmin: true` to a config document.
4. **Invalid Type**: Attempt to set `salePrice` to a string.
5. **Resource Poisoning**: Attempt to use a 2MB string as a product name.
6. **State Shortcutting**: Attempt to change order status from 'Baru Masuk' to 'Selesai' without intermediate steps (if applicable, though here any status update is allowed by owner).
7. **Orphaned Record**: Create a reminder without a user context.
8. **PII Leak**: Non-owner trying to read a customer's detailed notes or address.
9. **Query Scraping**: Authenticated user trying to list all customers from all stores.
10. **ID Poisoning**: Using a very long and strange character string as a productId.
11. **Immutable Violation**: Trying to change `createdAt` on an order.
12. **Negative Values**: Trying to set `stock` or `salePrice` to -100.

## Test Runner (firestore.rules.test.ts)
(To be implemented if testing environment was available, but here we focus on the rules logic).
