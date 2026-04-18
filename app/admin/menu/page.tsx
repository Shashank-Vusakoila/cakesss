'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getMenuItems, getCategories, addMenuItem, updateMenuItem, deleteMenuItem, addCategory } from '@/lib/firebase/firestore'
import { MenuItem, Category } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, X, Loader2, ImageIcon,
  ToggleLeft, ToggleRight, Upload, CheckCircle2, AlertCircle, Link as LinkIcon
} from 'lucide-react'
import Image from 'next/image'
import { formatCurrency } from '@/utils'
import toast from 'react-hot-toast'

const emptyItem: Omit<MenuItem, 'id'> = {
  name: '', description: '', price: 0, image: '', category: '',
  rating: 4.5, reviewCount: 0, isAvailable: true, isVeg: true,
  isBestseller: false, prepTime: 15, tags: [],
  createdAt: new Date(), updatedAt: new Date(),
}

// ─── Image Uploader ────────────────────────────────────────────────────────────
type UploadState = 'idle' | 'dragging' | 'uploading' | 'done' | 'error'

function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [preview, setPreview] = useState<string>(value || '')
  const [progress, setProgress] = useState(0)
  const [urlMode, setUrlMode] = useState(false)
  const [urlInput, setUrlInput] = useState(value || '')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (value && value !== preview) {
      setPreview(value)
      setUrlInput(value)
      if (value.startsWith('http')) setUploadState('done')
    }
  }, [value])

  const simulateProgress = () => {
    setProgress(0)
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 85) { clearInterval(progressRef.current!); return p }
        return p + Math.random() * 15
      })
    }, 200)
  }

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (JPG, PNG, WebP)')
      setUploadState('error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image must be under 5MB')
      setUploadState('error')
      return
    }
    const localURL = URL.createObjectURL(file)
    setPreview(localURL)
    setUploadState('uploading')
    simulateProgress()
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      clearInterval(progressRef.current!)
      setProgress(100)
      setPreview(data.url)
      setUrlInput(data.url)
      onChange(data.url)
      setUploadState('done')
      toast.success('Image uploaded to Cloudinary! ☁️')
    } catch {
      clearInterval(progressRef.current!)
      setErrorMsg('Upload failed. Check CLOUDINARY_API_SECRET in .env.local')
      setUploadState('error')
      setPreview('')
    }
  }, [onChange])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState('idle')
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return
    setPreview(urlInput)
    onChange(urlInput)
    setUploadState('done')
    setUrlMode(false)
    toast.success('Image URL applied!')
  }

  const reset = () => {
    setPreview('')
    setUrlInput('')
    setUploadState('idle')
    setErrorMsg('')
    setProgress(0)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600">Food Image</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setUrlMode(v => !v)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${urlMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
            <LinkIcon size={11} /> Paste URL instead
          </button>
          {preview && (
            <button type="button" onClick={reset} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
              <X size={11} /> Remove
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {urlMode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex gap-2">
            <input className="input-field flex-1 text-xs" placeholder="https://res.cloudinary.com/... or any image URL"
              value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()} />
            <button type="button" onClick={handleUrlSubmit} className="btn-primary text-xs px-3 py-2 flex-shrink-0">Apply</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setUploadState('dragging') }}
        onDragLeave={() => setUploadState(s => s === 'dragging' ? 'idle' : s)}
        onClick={() => uploadState !== 'uploading' && inputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden cursor-pointer
          ${uploadState === 'dragging' ? 'border-brand-orange bg-orange-50 scale-[1.01]' : ''}
          ${uploadState === 'done' ? 'border-green-300' : ''}
          ${uploadState === 'error' ? 'border-red-300 bg-red-50' : ''}
          ${uploadState === 'idle' ? 'border-gray-200 bg-gray-50 hover:border-brand-orange hover:bg-orange-50' : ''}
          ${uploadState === 'uploading' ? 'border-brand-orange bg-orange-50 cursor-wait' : ''}
        `}
        style={{ minHeight: preview && uploadState !== 'error' ? '180px' : '130px' }}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f) }} />

        {preview && uploadState !== 'error' && (
          <div className="absolute inset-0">
            <Image src={preview} alt="Preview" fill className={`object-cover transition-opacity duration-300 ${uploadState === 'uploading' ? 'opacity-40' : 'opacity-100'}`} unoptimized={preview.startsWith('blob:')} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}

        {/* Progress bar */}
        {uploadState === 'uploading' && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30">
            <motion.div className="h-full bg-brand-orange" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        )}

        {/* Content */}
        <div className={`relative z-10 flex flex-col items-center justify-center p-5 gap-2 text-center transition-all
          ${preview && uploadState === 'done' ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
          style={{ minHeight: 'inherit' }}>
          {uploadState === 'idle' && (
            <>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-1 group-hover:shadow-md transition-shadow">
                <Upload size={22} className="text-brand-orange" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Drop image here or click to browse</p>
              <p className="text-xs text-gray-400">JPG, PNG, WebP • Max 5MB • Auto-optimized via Cloudinary</p>
            </>
          )}
          {uploadState === 'dragging' && (
            <>
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-14 h-14 bg-brand-orange rounded-xl flex items-center justify-center">
                <Upload size={26} className="text-white" />
              </motion.div>
              <p className="text-sm font-bold text-brand-orange">Release to upload!</p>
            </>
          )}
          {uploadState === 'uploading' && (
            <>
              <Loader2 size={28} className="text-brand-orange animate-spin" />
              <p className="text-sm font-semibold text-brand-orange">Uploading... {Math.round(progress)}%</p>
              <p className="text-xs text-gray-400">Auto-cropping and optimizing for you</p>
            </>
          )}
          {uploadState === 'done' && preview && (
            <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2">
              <p className="text-xs text-white font-medium flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-green-400" /> Uploaded • Click to change
              </p>
            </div>
          )}
          {uploadState === 'error' && (
            <>
              <AlertCircle size={28} className="text-red-500" />
              <p className="text-sm font-semibold text-red-600">Upload Failed</p>
              <p className="text-xs text-red-400 max-w-[220px]">{errorMsg}</p>
              <button type="button" onClick={e => { e.stopPropagation(); reset() }}
                className="mt-1 text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                Try Again
              </button>
            </>
          )}
        </div>
      </div>

      {preview && uploadState === 'done' && !preview.startsWith('blob:') && (
        <p className="text-xs text-green-600 font-mono truncate bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
          <CheckCircle2 size={11} /> {preview.length > 55 ? preview.slice(0, 55) + '…' : preview}
        </p>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; item: Partial<MenuItem> | null; isEdit: boolean }>({ open: false, item: null, isEdit: false })
  const [saving, setSaving] = useState(false)
  const [catModal, setCatModal] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', icon: '🍽️' })
  const [filterCat, setFilterCat] = useState('all')

  async function loadData() {
    const [menuData, catData] = await Promise.all([getMenuItems(), getCategories()])
    setItems(menuData)
    setCategories(catData)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const openAdd = () => setModal({ open: true, item: { ...emptyItem }, isEdit: false })
  const openEdit = (item: MenuItem) => setModal({ open: true, item: { ...item }, isEdit: true })
  const closeModal = () => setModal({ open: false, item: null, isEdit: false })
  const setField = (field: string, value: any) => setModal(m => ({ ...m, item: { ...m.item!, [field]: value } }))

  const handleSave = async () => {
    const item = modal.item
    if (!item?.name?.trim()) { toast.error('Item name is required'); return }
    if (!item.price || item.price <= 0) { toast.error('Price must be greater than 0'); return }
    if (!item.category) { toast.error('Please select a category'); return }
    setSaving(true)
    try {
      if (modal.isEdit && item.id) {
        await updateMenuItem(item.id, item)
        toast.success('Item updated! ✅')
      } else {
        await addMenuItem({ ...emptyItem, ...item } as Omit<MenuItem, 'id'>)
        toast.success('Item added to menu! 🎉')
      }
      await loadData()
      closeModal()
    } catch { toast.error('Failed to save. Try again.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from menu?`)) return
    try { await deleteMenuItem(id); toast.success('Item deleted'); await loadData() }
    catch { toast.error('Failed to delete') }
  }

  const handleToggle = async (item: MenuItem) => {
    await updateMenuItem(item.id, { isAvailable: !item.isAvailable })
    await loadData()
    toast.success(item.isAvailable ? 'Marked unavailable' : 'Marked available')
  }

  const handleAddCategory = async () => {
    if (!newCat.name.trim()) { toast.error('Category name required'); return }
    await addCategory({ name: newCat.name, icon: newCat.icon, order: categories.length, isActive: true })
    toast.success('Category added!')
    setNewCat({ name: '', icon: '🍽️' })
    setCatModal(false)
    await loadData()
  }

  const filtered = items.filter(i => filterCat === 'all' || i.category === filterCat)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Menu Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{items.length} items · {categories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCatModal(true)} className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5">
            <Plus size={16} /> Category
          </button>
          <button onClick={openAdd} className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* First-time guide */}
      {categories.length === 0 && !loading && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3">
          <span className="text-2xl">👋</span>
          <div>
            <p className="font-semibold text-orange-800">Welcome! Start by adding categories first</p>
            <p className="text-sm text-orange-600 mt-0.5">
              Create categories like ☕ Hot Drinks, 🧋 Cold Drinks, 🍕 Snacks — then add items under them.
            </p>
            <button onClick={() => setCatModal(true)} className="mt-2 btn-primary text-xs py-1.5 px-3">
              + Add First Category
            </button>
          </div>
        </motion.div>
      )}

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {[{ id: 'all', name: `All (${items.length})`, icon: '📋' }, ...categories.map(c => ({ ...c, name: `${c.name} (${items.filter(i => i.category === c.id).length})` }))].map(cat => (
            <button key={cat.id} onClick={() => setFilterCat(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${filterCat === cat.id ? 'bg-brand-orange text-white shadow-orange' : 'bg-white text-gray-600 shadow-sm hover:text-brand-orange'}`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🍽️</div>
          <p className="font-semibold text-gray-600">No items yet</p>
          <p className="text-sm mt-1">Click "+ Add Item" to add your first menu item</p>
          <button onClick={openAdd} className="btn-primary mt-4 text-sm">+ Add First Item</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <motion.div key={item.id} layout className="card overflow-hidden group">
              <div className="relative h-36 bg-gray-100">
                {item.image
                  ? <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={32} className="text-gray-300" /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}>
                    {item.isVeg ? '🟢 VEG' : '🔴 NON-VEG'}
                  </span>
                </div>
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1 rounded-full">Unavailable</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description || 'No description'}</p>
                    <p className="font-bold text-brand-orange mt-1.5">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggle(item)} title={item.isAvailable ? 'Disable' : 'Enable'} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      {item.isAvailable ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} className="text-gray-300" />}
                    </button>
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                    {categories.find(c => c.id === item.category)?.icon} {categories.find(c => c.id === item.category)?.name || item.category}
                  </span>
                  {item.isBestseller && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">⭐ Bestseller</span>}
                  <span className="text-xs text-gray-400">⏱ {item.prepTime}m</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal.open && modal.item && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-3xl">
                  <div>
                    <h2 className="font-display font-bold text-xl text-gray-800">
                      {modal.isEdit ? '✏️ Edit Item' : '➕ Add New Item'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">{modal.isEdit ? 'Update details below' : 'Fill in all required fields'}</p>
                  </div>
                  <button onClick={closeModal} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                    <X size={16} />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* 🖼 Image uploader */}
                  <ImageUploader value={modal.item.image || ''} onChange={url => setField('image', url)} />

                  {/* Name */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Item Name <span className="text-red-400">*</span></label>
                    <input className="input-field" placeholder="e.g., Masala Chai, Samosa, Cold Coffee"
                      value={modal.item.name || ''} onChange={e => setField('name', e.target.value)} />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Description</label>
                    <textarea className="input-field resize-none" rows={2} placeholder="A mouth-watering description..."
                      value={modal.item.description || ''} onChange={e => setField('description', e.target.value)} />
                  </div>

                  {/* Price + Category */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1.5 block">Price (₹) <span className="text-red-400">*</span></label>
                      <input className="input-field" type="number" min="0" step="0.5" placeholder="0"
                        value={modal.item.price || ''} onChange={e => setField('price', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1.5 block">Category <span className="text-red-400">*</span></label>
                      <select className="input-field" value={modal.item.category || ''} onChange={e => setField('category', e.target.value)}>
                        <option value="">Select category...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Prep time + Rating */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1.5 block">Prep Time (mins)</label>
                      <input className="input-field" type="number" min="1" max="120"
                        value={modal.item.prepTime || 15} onChange={e => setField('prepTime', parseInt(e.target.value) || 15)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1.5 block">Rating (1–5)</label>
                      <input className="input-field" type="number" min="1" max="5" step="0.1"
                        value={modal.item.rating || 4.5} onChange={e => setField('rating', parseFloat(e.target.value))} />
                    </div>
                  </div>

                  {/* Toggle options */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Item Options</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: 'isVeg', label: 'Vegetarian', emoji: '🟢' },
                        { key: 'isBestseller', label: 'Bestseller', emoji: '⭐' },
                        { key: 'isAvailable', label: 'Available', emoji: '✅' },
                      ].map(toggle => {
                        const checked = (modal.item as any)[toggle.key] ?? false
                        return (
                          <button key={toggle.key} type="button" onClick={() => setField(toggle.key, !checked)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                              ${checked ? 'border-brand-orange bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            <span className="text-xl">{toggle.emoji}</span>
                            <span className={`text-xs font-medium ${checked ? 'text-brand-orange' : 'text-gray-500'}`}>
                              {toggle.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Save */}
                  <button onClick={handleSave} disabled={saving}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                    {saving
                      ? <><Loader2 size={18} className="animate-spin" /> Saving...</>
                      : modal.isEdit
                        ? <><CheckCircle2 size={18} /> Update Item</>
                        : <><Plus size={18} /> Add to Menu</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Category Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {catModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setCatModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-bold text-xl text-gray-800">Add Category</h2>
                  <button onClick={() => setCatModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X size={16} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Category Name</label>
                    <input className="input-field" placeholder="e.g., Hot Beverages, Snacks, Desserts"
                      value={newCat.name} onChange={e => setNewCat(v => ({ ...v, name: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Icon (emoji)</label>
                    <input className="input-field text-2xl" placeholder="☕" value={newCat.icon}
                      onChange={e => setNewCat(v => ({ ...v, icon: e.target.value }))} maxLength={4} />
                  </div>
                  <p className="text-xs text-gray-400">💡 Suggestions: ☕ 🧋 🍕 🍰 🥗 🍜 🥤 🍔 🍟 🌮 🫖 🧃</p>
                  <div className="flex gap-3">
                    <button onClick={() => setCatModal(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
                    <button onClick={handleAddCategory} className="flex-1 btn-primary text-sm">Add Category</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
