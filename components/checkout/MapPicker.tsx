'use client'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet + Next.js
const icon = L.divIcon({
  html: `<div class="bg-brand-primary w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg border-2 border-white ring-4 ring-brand-primary/20">📍</div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
})

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  initialCoords?: { lat: number; lng: number } | null
}

const DEFAULT_CENTER: [number, number] = [17.4323611, 78.6057222] // Mallapur, Bakes & Delights

function LocationMarker({ onSelect, initialPosition }: { onSelect: (lat: number, lng: number) => void, initialPosition: [number, number] }) {
  const [position, setPosition] = useState<[number, number]>(initialPosition)
  const map = useMap()

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      setPosition([lat, lng])
      onSelect(lat, lng)
      map.flyTo(e.latlng, map.getZoom())
    },
    dragend(e) {
      const center = e.target.getCenter()
      setPosition([center.lat, center.lng])
      onSelect(center.lat, center.lng)
    }
  })

  return (
    <Marker position={position} icon={icon} />
  )
}

export default function MapPicker({ onLocationSelect, initialCoords }: MapPickerProps) {
  const center: [number, number] = initialCoords ? [initialCoords.lat, initialCoords.lng] : DEFAULT_CENTER

  useEffect(() => {
    // If no initial coords, try to get user's current location
    if (!initialCoords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onLocationSelect(pos.coords.latitude, pos.coords.longitude)
        },
        () => console.log('Location access denied')
      )
    }
  }, [initialCoords, onLocationSelect])

  return (
    <div className="w-full h-full relative group">
      <MapContainer 
        center={center} 
        zoom={15} 
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <LocationMarker onSelect={onLocationSelect} initialPosition={center} />
      </MapContainer>
      
      {/* Decorative center crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-6 h-6 border-2 border-brand-primary/30 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-brand-primary rounded-full" />
        </div>
      </div>
      
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
           <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-100 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Drag to Pin Exactly</span>
           </div>
      </div>
    </div>
  )
}
