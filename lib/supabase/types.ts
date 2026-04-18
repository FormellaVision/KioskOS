export type Store = {
  id: string
  name: string
  slug: string
  owner_id: string
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  is_active: boolean
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  store_id: string
  name: string
  sort_order: number
  created_at: string
}

export type Product = {
  id: string
  store_id: string
  category_id: string | null
  name: string
  description: string | null
  image_url: string | null
  gtin: string | null
  price: number
  sale_price: number | null
  supplier_name: string | null
  supplier_contact: string | null
  is_available: boolean
  stock_count: number | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type Order = {
  id: string
  store_id: string
  customer_id: string | null
  status: 'new' | 'confirmed' | 'ready' | 'picked_up' | 'shipped' | 'cancelled' | 'refunded'
  fulfillment_type: 'pickup' | 'delivery'
  subtotal: number
  shipping_cost: number
  total: number
  stripe_payment_intent_id: string | null
  payment_status: string | null
  tracking_ref: string | null
  shipping_address: Record<string, unknown> | null
  customer_note: string | null
  internal_note: string | null
  confirmed_at: string | null
  ready_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export type Customer = {
  id: string
  store_id: string
  email: string
  name: string | null
  phone: string | null
  newsletter_opt_in: boolean
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_image: string | null
  quantity: number
  unit_price: number
  sale_price: number | null
  line_total: number
}
