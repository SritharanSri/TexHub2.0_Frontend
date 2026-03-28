import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import Button from './Button'

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-lg modal-backdrop-in" />

      {/* Modal panel */}
      <div
        className={`relative w-full ${sizes[size]} modal-scale-in flex flex-col max-h-[90vh]`}
        style={{ maxWidth: '95vw' }}
      >
        {/* Outer glow */}
        <div className="absolute -inset-[1px] rounded-[22px] bg-gradient-to-br from-violet-500/30 via-purple-400/10 to-indigo-500/20 blur-sm pointer-events-none z-0" />

        {/* Card */}
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[100%] ring-1 ring-black/8 z-10">

          {/* Decorative top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 z-20" />

          {/* Header */}
          <div className="relative flex items-center justify-between px-6 pt-6 pb-5 bg-gradient-to-r from-slate-50/80 to-white border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all duration-200 flex-shrink-0 group ring-1 ring-transparent hover:ring-red-200"
              aria-label="Close"
            >
              <X className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex gap-3 justify-end flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-backdrop-in {
          animation: backdropIn 0.2s ease forwards;
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .modal-scale-in {
          animation: modalScaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes modalScaleIn {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @media (max-width: 640px) {
          .modal-scale-in {
            align-self: flex-end;
            max-height: 92vh;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
          }
        }
      `}</style>
    </div>,
    document.body
  )
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, danger = false, loading = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Confirm Action'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            Confirm
          </Button>
        </>
      }
    >
      <div className="flex gap-4 items-start py-1">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ring-4 ${danger ? 'bg-red-50 ring-red-100' : 'bg-purple-50 ring-purple-100'}`}>
          <span className={`text-xl ${danger ? 'text-red-500' : 'text-purple-500'}`}>{danger ? '⚠️' : '❓'}</span>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed pt-2">{message}</p>
      </div>
    </Modal>
  )
}
