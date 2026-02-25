import Dexie, { type Table } from 'dexie'
import type { Product, Stock, Invoice, InvoiceLine, CashSession, CashMovement, Order, SyncQueueItem } from '@/types'

export class OrchideeDB extends Dexie {
  products!: Table<Product>
  stock!: Table<Stock>
  invoices!: Table<Invoice>
  invoice_lines!: Table<InvoiceLine>
  cash_sessions!: Table<CashSession>
  cash_movements!: Table<CashMovement>
  orders!: Table<Order>
  sync_queue!: Table<SyncQueueItem>

  constructor() {
    super('OrchideeNMSDB')
    this.version(1).stores({
      products: 'id, category_id, entity_id, active, name',
      stock: 'id, product_id, entity_id',
      invoices: 'id, entity_id, user_id, date, status',
      invoice_lines: 'id, invoice_id, product_id',
      cash_sessions: 'id, entity_id, cashier_id, status',
      cash_movements: 'id, session_id, type',
      orders: 'id, entity_id, user_id, status',
      sync_queue: 'id, table_name, operation, synced, created_at',
    })
  }
}

export const db = new OrchideeDB()
