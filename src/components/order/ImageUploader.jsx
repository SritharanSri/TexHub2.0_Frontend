import { useState, useRef, useCallback } from 'react'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 10

export default function ImageUploader({ files, onChange }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const processFiles = useCallback((newFiles) => {
    const validFiles = Array.from(newFiles)
      .filter(f => ACCEPTED.includes(f.type) && f.size <= MAX_SIZE_MB * 1024 * 1024)
      .map(f => ({ file: f, url: URL.createObjectURL(f), id: `${Date.now()}-${Math.random()}` }))
    onChange([...(files || []), ...validFiles])
  }, [files, onChange])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }

  const remove = (id) => onChange(files.filter(f => f.id !== id))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">Upload Reference</h3>
          <p className="text-gray-400 text-sm">Share inspiration images or sketches</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={() => setDragging(true)}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-4 cursor-pointer
          rounded-3xl border-2 border-dashed py-12 px-8 text-center
          transition-all duration-300
          ${dragging
            ? 'border-purple-500 bg-purple-50 scale-[1.01]'
            : 'border-gray-200 hover:border-purple-400 hover:bg-gray-50/50'}
        `}
      >
        <input ref={inputRef} type="file" multiple accept={ACCEPTED.join(',')}
          className="hidden" onChange={e => processFiles(e.target.files)} />

        <div className={`text-gray-400 transition-all duration-300 flex items-center justify-center ${dragging ? 'scale-110 text-purple-500' : 'hover:scale-105 hover:text-purple-400'}`}>
          <svg className="w-16 h-16 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
        </div>

        <div>
          <p className="font-black text-gray-800 text-lg mb-1">
            {dragging ? 'Drop to upload' : 'Drag & drop your images'}
          </p>
          <p className="text-gray-400 text-sm">or click to browse your files</p>
        </div>

        <div className="flex gap-2 mt-1">
          {['JPG', 'PNG', 'WEBP'].map(fmt => (
            <span key={fmt} className="text-xs font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{fmt}</span>
          ))}
          <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Max {MAX_SIZE_MB}MB</span>
        </div>
      </div>

      {/* Uploaded previews */}
      {files && files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-700 text-sm">{files.length} image{files.length > 1 ? 's' : ''} uploaded</p>
            <button onClick={() => onChange([])} className="text-xs text-red-500 hover:underline font-medium">Remove all</button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {files.map(f => (
              <div key={f.id} className="relative group rounded-2xl overflow-hidden aspect-square">
                <img src={f.url} alt={f.file.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                  <button
                    onClick={e => { e.stopPropagation(); remove(f.id) }}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="absolute bottom-1.5 inset-x-1.5 bg-black/60 rounded-lg px-1.5 py-0.5">
                  <p className="text-white text-[9px] font-medium truncate">{f.file.name}</p>
                </div>
              </div>
            ))}

            {/* Add more button */}
            <button onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-purple-400 hover:bg-purple-50 flex flex-col items-center justify-center gap-1.5 transition-all group">
              <svg className="w-6 h-6 text-gray-300 group-hover:text-purple-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs text-gray-300 group-hover:text-purple-500 font-semibold">Add</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
