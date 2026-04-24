'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getMenuItems, getCategories, addMenuItem, updateMenuItem, deleteMenuItem, addCategory, updateCategory, deleteCategory } from '@/lib/firebase/firestore'
import { MenuItem, Category } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, X, Loader2, ImageIcon,
  ToggleLeft, ToggleRight, Upload, CheckCircle2, AlertCircle, Link as LinkIcon, Star, ArrowRight
} from 'lucide-react'
import Image from 'next/image'
import { formatCurrency, getValidImageUrl } from '@/utils'
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
  const [catModal, setCatModal] = useState<{ open: boolean; cat: Partial<Category>; isEdit: boolean }>({ open: false, cat: { name: '', icon: '🍽️', image: '' }, isEdit: false })
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

  const handleSaveCategory = async () => {
    if (!catModal.cat.name?.trim()) { toast.error('Category name required'); return }
    if (catModal.isEdit && catModal.cat.id) {
       await updateCategory(catModal.cat.id, catModal.cat)
       toast.success('Category updated!')
    } else {
       await addCategory({ name: catModal.cat.name, icon: catModal.cat.icon || '🍽️', image: catModal.cat.image, order: categories.length, isActive: true })
       toast.success('Category added!')
    }
    setCatModal({ open: false, cat: { name: '', icon: '🍽️', image: '' }, isEdit: false })
    await loadData()
  }

  const handleDeleteCategory = async () => {
    if (!catModal.cat.id) return
    if (!confirm(`Delete category "${catModal.cat.name}"? This won't delete the items inside it.`)) return
    await deleteCategory(catModal.cat.id)
    toast.success('Category deleted!')
    setCatModal({ open: false, cat: { name: '', icon: '🍽️', image: '' }, isEdit: false })
    await loadData()
  }

  const filtered = items.filter(i => filterCat === 'all' || i.category === filterCat)

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
        <div>
          <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mb-2 block">Catalogue</span>
          <h1 className="font-display text-4xl font-black text-gray-900 tracking-tighter">Menu Management</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">{items.length} items across {categories.length} categories</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setCatModal({ open: true, cat: { name: '', icon: '🍽️', image: '' }, isEdit: false })} className="btn-secondary text-xs px-6 py-3.5 flex items-center gap-2">
            <Plus size={16} /> ADD CATEGORY
          </button>
          <button onClick={openAdd} className="btn-primary text-xs px-6 py-3.5 flex items-center gap-2 shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
            <Plus size={16} /> ADD NEW ITEM
          </button>
        </div>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 mb-10 scrollbar-hide">
          <button
            onClick={() => setFilterCat('all')}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filterCat === 'all'
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                : 'bg-white text-gray-500 hover:text-brand-primary border border-gray-100 shadow-sm'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <div key={cat.id} className="relative group/cat">
              <button
                onClick={() => setFilterCat(cat.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterCat === cat.id
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                    : 'bg-white text-gray-500 hover:text-brand-primary border border-gray-100 shadow-sm'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setCatModal({ open: true, cat, isEdit: true }) }}
                className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-brand-primary border border-gray-100 shadow-sm rounded-full p-1.5 opacity-0 group-hover/cat:opacity-100 transition-opacity z-10"
              >
                <Pencil size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-60 rounded-[2.5rem]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
          <div className="text-6xl mb-6">🍽️</div>
          <h3 className="font-display text-3xl font-black text-gray-900 tracking-tight">No Items Yet</h3>
          <p className="text-gray-400 mt-4 max-w-xs mx-auto font-medium">Start building your menu by adding your first item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filtered.map(item => (
            <motion.div
              key={item.id}
              layout
              className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500"
            >
              <div className="relative h-48 bg-gray-50 overflow-hidden">
                {item.image
                  ? <Image src={getValidImageUrl(item.image, "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80")} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={40} /></div>}
                
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.isVeg ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'} backdrop-blur-md border border-white/20`}>
                    {item.isVeg ? 'Veg' : 'Non-Veg'}
                  </span>
                </div>

                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] border-2 border-white/30 px-4 py-2 rounded-xl">Sold Out</span>
                  </div>
                )}

                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button onClick={() => openEdit(item)} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-gray-900 shadow-xl hover:bg-white hover:scale-110 active:scale-95 transition-all">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id, item.name)} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-red-500 shadow-xl hover:bg-white hover:scale-110 active:scale-95 transition-all">
                      <Trash2 size={16} />
                    </button>
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {categories.find(c => c.id === item.category)?.name || 'General'}
                  </p>
                  <button onClick={() => handleToggle(item)} className="transition-transform active:scale-90">
                    {item.isAvailable 
                      ? <ToggleRight size={28} className="text-brand-primary" /> 
                      : <ToggleLeft size={28} className="text-gray-300" />}
                  </button>
                </div>

                <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight mb-2 group-hover:text-brand-primary transition-colors truncate">{item.name}</h3>
                <p className="text-[13px] text-gray-400 font-medium line-clamp-2 leading-relaxed mb-6">{item.description}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Price</span>
                     <span className="font-black text-xl text-gray-900">{formatCurrency(item.price)}</span>
                   </div>
                   <div className="flex -space-x-2">
                      {item.isBestseller && (
                        <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-amber-500" title="Bestseller">
                          <Star size={12} fill="currentColor" />
                        </div>
                      )}
                      <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-gray-400" title="Prep Time">
                        {item.prepTime}m
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal (Lightweight redesign) ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal.open && modal.item && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[100]" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-3xl font-black text-gray-900 tracking-tighter">
                      {modal.isEdit ? 'Update Item' : 'New Creation'}
                    </h2>
                    <p className="text-gray-400 text-sm font-medium mt-1">Refine your menu masterpiece</p>
                  </div>
                  <button onClick={closeModal} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all text-gray-400 hover:text-gray-900">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 scrollbar-hide">
                  <ImageUploader value={modal.item.image || ''} onChange={url => setField('image', url)} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Item Identity</label>
                        <input className="input-field" placeholder="Gourmet Chocolate Cake"
                          value={modal.item.name || ''} onChange={e => setField('name', e.target.value)} />
                     </div>
                     <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Soulful Description</label>
                        <textarea className="input-field min-h-[100px]" placeholder="Describe the flavors..."
                          value={modal.item.description || ''} onChange={e => setField('description', e.target.value)} />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Price (₹)</label>
                        <input className="input-field font-black" type="number"
                          value={modal.item.price || ''} onChange={e => setField('price', parseFloat(e.target.value) || 0)} />
                     </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Category</label>
                        <select className="input-field font-black" value={modal.item.category || ''} onChange={e => setField('category', e.target.value)}>
                          <option value="">Choose...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     {[
                        { key: 'isVeg', label: 'VEG', icon: '🟢' },
                        { key: 'isBestseller', label: 'STAR', icon: '⭐' },
                        { key: 'isAvailable', label: 'LIVE', icon: '✅' },
                     ].map(t => (
                        <button key={t.key} onClick={() => setField(t.key, !(modal.item as any)[t.key])}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                            (modal.item as any)[t.key] ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-100 text-gray-400'
                          }`}>
                           <span className="text-xl mb-1">{t.icon}</span>
                           <span className="text-[10px] font-black tracking-widest">{t.label}</span>
                        </button>
                     ))}
                  </div>
                </div>

                <div className="p-10 border-t border-gray-100 bg-gray-50/50">
                   <button onClick={handleSave} disabled={saving} className="w-full btn-primary py-5 rounded-[1.5rem] shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3">
                     {saving ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}
                     <span className="uppercase tracking-[0.2em] font-black text-sm">Save Menu Item</span>
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Category Modal (Small & Targeted) */}
      <AnimatePresence>
        {catModal.open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[120]" onClick={() => setCatModal({ ...catModal, open: false })} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[130] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-start mb-6">
                   <h3 className="text-2xl font-black text-gray-900 tracking-tighter">{catModal.isEdit ? 'Edit Category' : 'New Category'}</h3>
                   <button onClick={() => setCatModal({ ...catModal, open: false })} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X size={16} /></button>
                </div>
                <div className="space-y-6 overflow-y-auto scrollbar-hide pr-2 pb-2">
                   <div>
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Category Cover Image</label>
                     <ImageUploader value={catModal.cat.image || ''} onChange={url => setCatModal(v => ({ ...v, cat: { ...v.cat, image: url } }))} />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Category Name</label>
                     <input className="input-field" placeholder="Pastries..." value={catModal.cat.name || ''} onChange={e => setCatModal(v => ({...v, cat: { ...v.cat, name: e.target.value}}))} />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Emoji Icon</label>
                     <input className="input-field text-2xl" value={catModal.cat.icon || ''} onChange={e => setCatModal(v => ({...v, cat: { ...v.cat, icon: e.target.value}}))} />
                   </div>
                   <div className="flex gap-3 pt-4">
                     <button onClick={handleSaveCategory} className="flex-1 btn-primary py-4 rounded-2xl shadow-lg">{catModal.isEdit ? 'SAVE' : 'CREATE'}</button>
                     {catModal.isEdit && (
                       <button onClick={handleDeleteCategory} className="px-6 py-4 rounded-2xl bg-red-50 text-red-500 font-black tracking-widest text-xs uppercase hover:bg-red-100 transition-colors">
                         DELETE
                       </button>
                     )}
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
