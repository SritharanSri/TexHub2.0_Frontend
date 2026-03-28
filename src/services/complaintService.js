import api from './api'
import { complaints as mockComplaints } from './mockData'

const COMPLAINTS_KEY = 'texhub_complaints'
const loadComplaints = () => {
  const stored = JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]')
  if (stored.length) return stored
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(mockComplaints))
  return [...mockComplaints]
}
const saveComplaints = (data) => localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(data))

export const complaintService = {
  create: (formData) => api.post('/complaints', formData),
  getMine: (params) => api.get('/complaints/my', { params }),
  getById: (id)     => api.get(`/complaints/${id}`),

  // Demo-only methods for admin pages
  getComplaints() {
    return loadComplaints()
  },

  resolve(id) {
    const data = loadComplaints()
    const updated = data.map(c => c.id === id ? { ...c, status: 'resolved' } : c)
    saveComplaints(updated)
    return updated
  },

  escalate(id) {
    const data = loadComplaints()
    const updated = data.map(c => c.id === id ? { ...c, status: 'escalated' } : c)
    saveComplaints(updated)
    return updated
  },

  updateStatus(id, status, extra = {}) {
    const data = loadComplaints()
    const updated = data.map(c => c.id === id ? { ...c, status, ...extra } : c)
    saveComplaints(updated)
    return updated
  },
}
