import api from './api'
import { customerOrders } from './mockData'

const ESCROW_KEY = 'texhub_escrow'

// Helper to load/save demo escrow data from localStorage
const loadEscrow = () => JSON.parse(localStorage.getItem(ESCROW_KEY) || '[]')
const saveEscrow = (data) => localStorage.setItem(ESCROW_KEY, JSON.stringify(data))

export const escrowService = {
  getByOrder: (orderId) => api.get(`/orders/${orderId}/escrow`),

  // Demo-only: get all escrow transactions from localStorage
  getEscrowTransactions() {
    const stored = loadEscrow()
    if (stored.length) return stored

    // Seed from delivered mock orders
    const delivered = customerOrders.filter(o => o.status === 'delivered' && o.amount)
    const seeded = delivered.map(o => ({
      id: `ESC-${o.id}`,
      orderId: o.id,
      amount: o.amount,
      commission: Math.round(o.amount * 0.10),
      tailorPayout: o.amount - Math.round(o.amount * 0.10),
      tailorName: o.selectedTailor || 'Unknown',
      status: 'held',
      createdAt: o.placedOn || '2026-03-01',
    }))
    saveEscrow(seeded)
    return seeded
  },

  // Demo-only: release escrow payment
  releasePayment(id) {
    const data = loadEscrow()
    const updated = data.map(t =>
      t.id === id ? { ...t, status: 'released', releasedAt: new Date().toISOString() } : t
    )
    saveEscrow(updated)
    return updated
  },
}
