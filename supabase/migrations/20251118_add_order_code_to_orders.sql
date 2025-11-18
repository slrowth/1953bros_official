ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_code VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_code_key
  ON orders(order_code)
  WHERE order_code IS NOT NULL;

