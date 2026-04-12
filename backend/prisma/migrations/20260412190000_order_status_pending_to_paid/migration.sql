-- Flujo nuevo: sin PENDING; pedidos antiguos pasan a PAID.
UPDATE "Order" SET status = 'PAID' WHERE status = 'PENDING';
