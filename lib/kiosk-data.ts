import { Product, Order, Customer } from './kiosk-types';

export const PRODUCTS: Product[] = [
  { id: 1, name: 'Red Bull 250ml', category: 'Getränke', price: 1.99, sale_price: null, available: true, image: null, stock_count: 24, sku: 'RB-250' },
  { id: 2, name: 'Marlboro Gold 20er', category: 'Tabak', price: 8.50, sale_price: 7.99, available: true, image: null, stock_count: 8, sku: 'ML-G20' },
  { id: 3, name: 'Lays Paprika 150g', category: 'Snacks', price: 1.79, sale_price: null, available: false, image: null, stock_count: 0, sku: 'LY-PAP' },
  { id: 4, name: 'Coca Cola 500ml', category: 'Getränke', price: 1.89, sale_price: 1.49, available: true, image: null, stock_count: 31, sku: 'CC-500' },
  { id: 5, name: 'Feuerzeug BIC', category: 'Zubehör', price: 2.50, sale_price: null, available: true, image: null, stock_count: null, sku: 'BIC-01' },
  { id: 6, name: 'Agua Mentha Minze 25g', category: 'Tabak', price: 4.99, sale_price: 3.99, available: true, image: null, stock_count: 5, sku: 'AM-MNZ' },
];

export const ORDERS: Order[] = [
  { id: '#1044', customer: 'Ahmed K.', items: '2x Red Bull, 1x Lays', total: 5.67, status: 'new', time: 'vor 3 Min', type: 'pickup' },
  { id: '#1043', customer: 'Sara M.', items: '1x Marlboro Gold', total: 8.50, status: 'confirmed', time: 'vor 18 Min', type: 'pickup' },
  { id: '#1042', customer: 'Jonas B.', items: '3x Coca Cola, 1x BIC', total: 8.17, status: 'ready', time: 'vor 35 Min', type: 'pickup' },
  { id: '#1041', customer: 'Maria L.', items: '1x Agua Mentha', total: 3.99, status: 'picked_up', time: 'vor 1 Std', type: 'pickup' },
  { id: '#1040', customer: 'Tom R.', items: '2x Red Bull', total: 2.98, status: 'cancelled', time: 'vor 2 Std', type: 'delivery' },
];

export const CUSTOMERS: Customer[] = [
  { id: 1, name: 'Ahmed K.', email: 'ahmed@example.com', orders: 8, newsletter: true },
  { id: 2, name: 'Sara M.', email: 'sara@example.com', orders: 3, newsletter: false },
  { id: 3, name: 'Jonas B.', email: 'jonas@example.com', orders: 12, newsletter: true },
  { id: 4, name: 'Maria L.', email: 'maria@example.com', orders: 1, newsletter: false },
];

export const CATEGORIES = ['Alle', 'Getränke', 'Snacks', 'Tabak', 'Zubehör'];
