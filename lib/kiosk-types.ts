export type NavPage = 'dashboard' | 'products' | 'orders' | 'customers' | 'settings';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  sale_price: number | null;
  available: boolean;
  image: string | null;
  stock_count: number | null;
  sku: string;
  supplier?: string;
}

export type OrderStatus = 'new' | 'confirmed' | 'ready' | 'picked_up' | 'cancelled';

export interface Order {
  id: string;
  customer: string;
  items: string;
  total: number;
  status: OrderStatus;
  time: string;
  type: 'pickup' | 'delivery';
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  orders: number;
  newsletter: boolean;
}
