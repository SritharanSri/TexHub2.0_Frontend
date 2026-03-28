import { useState, useEffect } from 'react'
import { UserCheck, XCircle, Eye, CheckCircle, Clock, AlertCircle, MapPin, Phone, Mail, Briefcase, Store, FileText } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'
import { getFileUrl } from '../../services/api'
import { pendingTailors as mockPendingTailors } from '../../services/mockData'

const statusBadge = {
  pending:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
}

export default function TailorApprovals() {
  const { user } = useAuth()
  const isDemo = user?._demo === true

  const [tailors, setTailors] = useState([])
  const [selected, setSelected] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState(!isDemo)
  const [actionLoading, setActionLoading] = useState(null)
  const [nicPreview, setNicPreview] = useState(null)

  useEffect(() => {
    if (isDemo) {
      // Demo user: original mock behavior
      const localPending = JSON.parse(localStorage.getItem('texhub_pending_tailors') || '[]')
      const formattedLocal = localPending.map(t => ({ ...t, status: t.status || 'pending' }))
      setTailors([...formattedLocal, ...mockPendingTailors])
      return
    }

    // Real user: fetch from API
    const fetchTailors = async () => {
      try {
        const res = await adminService.getPendingTailors()
        const data = res?.data || res || []
        const list = Array.isArray(data) ? data : (data.tailors || data.results || [])
        setTailors(list.map(t => {
          const u = t.user || {}
          return {
            ...t,
            id: t.id || t._id,
            name: u.name || t.name || '',
            email: u.email || t.email || '',
            phone: u.phone || t.phone || '',
            avatar: u.avatar || t.avatar || '',
            status: t.verificationStatus || t.status || 'pending',
          }
        }))
      } catch (err) {
        console.error('Failed to fetch pending tailors:', err)
        setTailors([])
      } finally {
        setLoading(false)
      }
    }

    fetchTailors()
  }, [isDemo])

  const saveStatuses = (list) => {
    // Only used in demo mode
    const localOnly = list.filter(t => !mockPendingTailors.some(p => p.id === t.id))
    localStorage.setItem('texhub_pending_tailors', JSON.stringify(localOnly))
  }

  const approve = async (id) => {
    if (isDemo) {
      setTailors(t => {
        const updated = t.map(x => x.id === id ? { ...x, status: 'approved' } : x)
        saveStatuses(updated)
        return updated
      })
      setSelected(null)
      return
    }

    setActionLoading(id)
    try {
      await adminService.verifyTailor(id, { status: 'approved' })
      setTailors(t => t.map(x => (x.id === id || x._id === id) ? { ...x, status: 'approved' } : x))
      setSelected(null)
    } catch (err) {
      console.error('Failed to approve tailor:', err)
      alert('Failed to approve tailor. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const reject = async (id, reason) => {
    if (isDemo) {
      setTailors(t => {
        const updated = t.map(x => x.id === id ? { ...x, status: 'rejected', rejectReason: reason } : x)
        saveStatuses(updated)
        return updated
      })
      setRejectModal(null)
      setSelected(null)
      setRejectReason('')
      return
    }

    setActionLoading(id)
    try {
      await adminService.verifyTailor(id, { status: 'rejected', verificationNote: reason })
      setTailors(t => t.map(x => (x.id === id || x._id === id) ? { ...x, status: 'rejected', rejectReason: reason } : x))
      setRejectModal(null)
      setSelected(null)
      setRejectReason('')
    } catch (err) {
      console.error('Failed to reject tailor:', err)
      alert('Failed to reject tailor. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const tabs = ['All', 'Pending', 'Approved', 'Rejected']
  const [tab, setTab] = useState('All')
  const filtered = tab === 'All' ? tailors : tailors.filter(t => t.status === tab.toLowerCase())

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Tailor Approvals</h2>
          <p className="text-gray-500 text-sm mt-1">{tailors.filter(t=>t.status==='pending').length} pending review</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-700">{tailors.filter(t=>t.status==='pending').length} Pending</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {filtered.map(tailor => (
          <div key={tailor.id || tailor._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-wrap gap-4 justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                  {(tailor.name || 'T').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-lg">{tailor.name}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge[tailor.status]?.cls}`}>
                      {statusBadge[tailor.status]?.label}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{tailor.email} · {tailor.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelected(tailor)}>
                  <Eye className="w-3.5 h-3.5" /> View Details
                </Button>
                {tailor.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => approve(tailor.id || tailor._id)}
                      className="bg-green-600 hover:bg-green-700"
                      loading={actionLoading === (tailor.id || tailor._id)}>
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectModal(tailor)}>
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Details row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                ['Specialization', tailor.specialization || tailor.specialty || ''],
                ['Experience', tailor.experience || ''],
                ['Location', tailor.shopAddress || tailor.city || tailor.location || ''],
                ['NIC Number', tailor.nicNumber || tailor.nic || ''],
              ].map(([k,v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">{k}</p>
                  <p className="font-semibold text-gray-800 text-sm mt-0.5">{v || '—'}</p>
                </div>
              ))}
            </div>

            {/* NIC images */}
            <div className="flex gap-3 mt-4">
              {[['NIC Front', tailor.nicFront], ['NIC Back', tailor.nicBack]].map(([label, path]) => {
                const url = getFileUrl(path)
                return (
                  <div key={label} className="flex-1 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    {url ? (
                      <img src={url} alt={label} className="w-full h-32 object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setNicPreview({ url, label })} />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 h-32 border border-dashed border-gray-300 rounded-xl">
                        <span className="text-2xl">🪪</span>
                        <p className="text-xs text-gray-400">No image</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 text-center py-1.5 bg-gray-50">{label}</p>
                  </div>
                )
              })}
            </div>

            {(tailor.rejectReason || tailor.rejectionReason) && (
              <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-xs text-red-600"><strong>Rejection reason:</strong> {tailor.rejectReason || tailor.rejectionReason}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-3">Applied on {new Date(tailor.appliedOn || tailor.createdAt || Date.now()).toLocaleDateString('en-IN')}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <UserCheck className="w-12 h-12 mx-auto opacity-30 mb-3" />
            <p>No tailors in this category</p>
          </div>
        )}
      </div>

      {/* Reject reason modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)}
        title={`Reject Application`} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger"
              loading={actionLoading === (rejectModal?.id || rejectModal?._id)}
              onClick={() => reject(rejectModal.id || rejectModal._id, rejectReason || 'Document quality insufficient')}>
              <XCircle className="w-3.5 h-3.5" /> Confirm Reject
            </Button>
          </>
        }>
        <div className="space-y-4">
          {/* Tailor identity */}
          <div className="flex items-center gap-3 bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0 shadow">
              {(rejectModal?.name || 'T').charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-900">{rejectModal?.name}</p>
              <p className="text-xs text-gray-400">{rejectModal?.email}</p>
            </div>
          </div>
          {/* Warning banner */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">The tailor will be notified with this reason and can <strong>resubmit</strong> their application.</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Reason for Rejection</label>
            <textarea rows={3} value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. NIC images are blurry. Please upload clear photos."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 bg-gray-50 hover:bg-white transition-colors" />
          </div>
        </div>
      </Modal>

      {/* NIC image preview modal */}
      <Modal isOpen={!!nicPreview} onClose={() => setNicPreview(null)} title={nicPreview?.label || 'NIC Preview'} size="lg">
        <div className="flex flex-col items-center gap-3 bg-gray-50 rounded-2xl p-3">
          <img src={nicPreview?.url} alt={nicPreview?.label} className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md" />
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-white rounded-full px-4 py-1.5 shadow-sm border border-gray-100">
            <span>🪪</span>
            <span>{nicPreview?.label}</span>
          </div>
        </div>
      </Modal>

      {/* View Details modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Tailor Details" size="lg"
        footer={
          selected?.status === 'pending' ? (
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
              <Button onClick={() => { approve(selected.id || selected._id); }}
                className="bg-green-600 hover:bg-green-700"
                loading={actionLoading === (selected?.id || selected?._id)}>
                <CheckCircle className="w-4 h-4" /> Approve
              </Button>
              <Button variant="danger" onClick={() => { setRejectModal(selected); setSelected(null); }}>
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
          )
        }>
        {selected && (
          <div className="space-y-5">
            {/* Profile header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
                {(selected.name || 'T').charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selected.name}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  {selected.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{selected.email}</span>}
                  {selected.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{selected.phone}</span>}
                </div>
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-2 ${statusBadge[selected.status]?.cls}`}>
                  {statusBadge[selected.status]?.label}
                </span>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                [Briefcase, 'Specialization', selected.specialization || '—'],
                [Clock, 'Experience', selected.experience ? `${selected.experience} years` : '—'],
                [Store, 'Shop Name', selected.shopName || '—'],
                [MapPin, 'Shop Address', selected.shopAddress || '—'],
                [FileText, 'NIC Number', selected.nicNumber || '—'],
                [Phone, 'Shop Phone', selected.shopPhone || '—'],
              ].map(([Icon, label, value]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Icon className="w-3 h-3" />{label}</p>
                  <p className="font-semibold text-gray-800 text-sm mt-1">{value}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            {selected.bio && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">About</p>
                <p className="text-sm text-gray-700">{selected.bio}</p>
              </div>
            )}

            {/* NIC images */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">NIC Documents</p>
              <div className="grid grid-cols-2 gap-3">
                {[['NIC Front', selected.nicFront], ['NIC Back', selected.nicBack]].map(([label, path]) => {
                  const url = getFileUrl(path)
                  return (
                    <div key={label} className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                      {url ? (
                        <img src={url} alt={label} className="w-full h-48 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => { setSelected(null); setTimeout(() => setNicPreview({ url, label }), 200); }} />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 h-48 border border-dashed border-gray-300 rounded-xl">
                          <span className="text-2xl">🪪</span>
                          <p className="text-xs text-gray-400">No image</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 text-center py-1.5 bg-gray-50">{label}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rejection reason */}
            {(selected.rejectReason || selected.rejectionReason || selected.verificationNote) && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-xs text-red-600"><strong>Rejection reason:</strong> {selected.verificationNote || selected.rejectReason || selected.rejectionReason}</p>
              </div>
            )}

            <p className="text-xs text-gray-400">Applied on {new Date(selected.appliedOn || selected.createdAt || Date.now()).toLocaleDateString('en-IN')}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
