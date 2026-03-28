import { forwardRef, isValidElement } from 'react'

const Input = forwardRef(function Input({
  label,
  error,
  hint,
  icon,
  className = '',
  inputClassName = '',
  required = false,
  ...props
}, ref) {
  // Support both: icon={<User />}  AND  icon={User} (component ref)
  const IconNode = icon
    ? isValidElement(icon)
      ? <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</div>
      : <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{(() => { const I = icon; return <I className="w-4 h-4" /> })()}</div>
    : null

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {IconNode}
        <input
          ref={ref}
          className={`
            input-field
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-400 focus:ring-red-300 bg-red-50/50' : ''}
            ${inputClassName}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
})

export default Input

export function Textarea({ label, error, className = '', required = false, ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={4}
        className={`input-field resize-none ${error ? 'border-red-400 focus:ring-red-300' : ''}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', required = false, ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`input-field ${error ? 'border-red-400 focus:ring-red-300' : ''}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
