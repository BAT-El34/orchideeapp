export type UserRole = 'super_admin' | 'admin' | 'manager' | 'vendeur' | 'caissier' | 'readonly'

export type UserStatus = 'pending' | 'active' | 'suspended'

export interface Entity {
  id: string
  name: string
  slug: string
  theme_color: string
  logo_url: string | null
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  entity_id: string | null
  role: UserRole
  pin_code_hash: string | null
  status: UserStatus
  last_login: string | null
  created_at: string
}

export interface ProductCategory {
  id: string
  name: string
  entity_id: string | null
}

export interface Product {
  id: string
  name: string
  category_id: string | null
  price_buy: number
  price_sell: number
  unit: string
  barcode: string | null
  entity_id: string | null
  active: boolean
  created_at: string
  product_categories?: ProductCategory
}

export interface Stock {
  id: string
  product_id: string
  entity_id: string
  quantity: number
  min_threshold: number
  updated_at: string
  products?: Product
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

export interface StockMovement {
  id: string
  product_id: string
  entity_id: string
  type: StockMovementType
  quantity: number
  reference: string | null
  user_id: string | null
  created_at: string
  products?: Product
  users?: User
}

export type InvoiceStatus = 'draft' | 'validated' | 'cancelled'

export interface Invoice {
  id: string
  entity_id: string
  user_id: string | null
  date: string
  total_buy: number
  total_sell: number
  margin: number
  status: InvoiceStatus
  notes: string | null
  created_at: string
  users?: User
  invoice_lines?: InvoiceLine[]
}

export interface InvoiceLine {
  id: string
  invoice_id: string
  product_id: string | null
  product_name_snapshot: string
  quantity: number
  price_buy: number
  price_sell: number
  total_buy: number
  total_sell: number
  products?: Product
}

export type CashSessionStatus = 'open' | 'closed'

export interface CashSession {
  id: string
  entity_id: string
  cashier_id: string
  opening_amount: number
  closing_amount_declared: number | null
  closing_amount_calculated: number | null
  variance: number | null
  opened_at: string
  closed_at: string | null
  status: CashSessionStatus
  notes: string | null
  users?: User
}

export type CashMovementType = 'SALE' | 'EXPENSE' | 'DEPOSIT' | 'REFUND'

export interface CashMovement {
  id: string
  session_id: string
  type: CashMovementType
  amount: number
  description: string | null
  invoice_id: string | null
  created_at: string
}

export type OrderType = 'MANUAL' | 'AUTO'
export type OrderStatus = 'pending_validation' | 'sent' | 'in_preparation' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  entity_id: string
  user_id: string | null
  type: OrderType
  status: OrderStatus
  delivery_date_requested: string | null
  comment: string | null
  created_at: string
  users?: User
  order_lines?: OrderLine[]
}

export interface OrderLine {
  id: string
  order_id: string
  product_id: string | null
  product_name_snapshot: string
  quantity_ordered: number
  quantity_delivered: number
  products?: Product
}

export interface StockThreshold {
  id: string
  entity_id: string
  product_id: string
  min_stock: number
  reorder_qty: number
  auto_order: boolean
  manual_validation_required: boolean
  active: boolean
  products?: Product
}

export type NotificationType = 'ORDER' | 'REPORT' | 'ALERT' | 'CASH' | 'VALIDATION'
export type NotificationChannel = 'in_app' | 'whatsapp' | 'email'
export type NotificationStatus = 'pending' | 'sent' | 'read' | 'validated'

export interface Notification {
  id: string
  entity_id: string | null
  from_user_id: string | null
  to_role: string | null
  to_user_id: string | null
  type: NotificationType
  message: string
  reference_id: string | null
  channel: NotificationChannel
  status: NotificationStatus
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  entity_id: string | null
  action: string
  resource: string
  resource_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  users?: User
}

export interface DailyReport {
  id: string
  entity_id: string
  user_id: string | null
  date: string
  total_sales: number
  total_expenses: number
  nb_transactions: number
  nb_returns: number
  pdf_url: string | null
  validated_by: string | null
  validated_at: string | null
}

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE'

export interface SyncQueueItem {
  id: string
  table_name: string
  operation: SyncOperation
  payload: Record<string, unknown>
  synced: boolean
  created_at: string
}

export interface Permission {
  id: string
  role: UserRole
  action: string
  resource: string
  entity_id: string | null
  enabled: boolean
}

export interface DashboardStats {
  totalSalesToday: number
  totalInvoicesToday: number
  cashSessionOpen: boolean
  lowStockCount: number
  pendingOrdersCount: number
  pendingNotificationsCount: number
}
