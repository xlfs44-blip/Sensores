import { useEffect, useMemo, useState } from 'react'
import DeckGL from '@deck.gl/react'
import { ScatterplotLayer, BitmapLayer } from '@deck.gl/layers'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { TileLayer } from '@deck.gl/geo-layers'
import { supabase } from './supabaseClient'

const VISTA_INICIAL = { longitude: -58.44, latitude: -34.61, zoom: 11.3, pitch: 0, bearing: 0 }

// Color por categoría (RGB): Alta = temperatura más alta
const COLORES = {
  Alta: [217, 48, 37],
  Media: [245, 158, 11],
  Baja: [24, 128, 56],
}

// Mapa base (OpenStreetMap) dibujado como capa de deck.gl
const capaBase = new TileLayer({
  id: 'mapa-base',
  data: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  minZoom: 0,
  maxZoom: 19,
  tileSize: 256,
  renderSubLayers: (props) => {
    const { west, south, east, north } = props.tile.bbox
    return new BitmapLayer(props, {
      data: null,
      image: props.data,
      bounds: [west, south, east, north],
    })
  },
})

export default function App() {
  const [puntos, setPuntos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [hover, setHover] = useState(null)
  const [verCalor, setVerCalor] = useState(false) // Desafío adicional, Nivel 2

  // Etapa 4: consulta a Supabase
  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from('puntos')
        .select('id, nombre, categoria, latitud, longitud, valor, vibracion, muestras, descripcion')
      if (error) setError(error.message)
      else {
        console.log('Registros recibidos de Supabase:', data)
        setPuntos(data)
      }
      setCargando(false)
    }
    cargar()
  }, [])

  // Etapa 7: indicadores calculados con los datos cargados
  const kpi = useMemo(() => {
    if (!puntos.length) return { total: 0, promedio: 0, max: null, min: null, altas: 0 }
    const total = puntos.length
    const promedio = puntos.reduce((s, p) => s + p.valor, 0) / total
    const max = puntos.reduce((m, p) => (p.valor > m.valor ? p : m))
    const min = puntos.reduce((m, p) => (p.valor < m.valor ? p : m))
    const altas = puntos.filter((p) => p.categoria === 'Alta').length
    return { total, promedio, max, min, altas }
  }, [puntos])

  // Etapa 5: ScatterplotLayer. ¡Posición = [LONGITUD, LATITUD]!
  const capas = [
    capaBase,
    verCalor
      ? new HeatmapLayer({
          id: 'calor',
          data: puntos,
          getPosition: (d) => [d.longitud, d.latitud],
          getWeight: (d) => Math.max(0.05, d.valor - (kpi.min ? kpi.min.valor : 0) + 0.05),
          radiusPixels: 70,
        })
      : new ScatterplotLayer({
          id: 'sensores',
          data: puntos,
          pickable: true,
          getPosition: (d) => [d.longitud, d.latitud],
          getFillColor: (d) => COLORES[d.categoria] ?? [100, 100, 100],
          getRadius: 300,
          radiusMinPixels: 7,
          radiusMaxPixels: 25,
          opacity: 0.85,
          stroked: true,
          getLineColor: [255, 255, 255],
          lineWidthMinPixels: 1,
          onHover: (info) => setHover(info.object ? info : null),
        }),
  ]

  return (
    <div className="app">
      <header>
        <h1>Mapa de Sensores Ambientales – Temperatura</h1>
        <div className="kpis">
          <div className="kpi"><b>{kpi.total}</b><span>Sensores registrados</span></div>
          <div className="kpi"><b>{kpi.promedio.toFixed(2)} °C</b><span>Temperatura promedio</span></div>
          <div className="kpi"><b>{kpi.max ? kpi.max.valor.toFixed(2) : '-'} °C</b><span>Máxima ({kpi.max ? kpi.max.nombre : '-'})</span></div>
          <div className="kpi"><b>{kpi.min ? kpi.min.valor.toFixed(2) : '-'} °C</b><span>Mínima ({kpi.min ? kpi.min.nombre : '-'})</span></div>
          <div className="kpi"><b>{kpi.altas}</b><span>Sensores en categoría Alta</span></div>
        </div>
      </header>

      <main>
        {cargando && <div className="aviso">Cargando datos desde Supabase…</div>}
        {error && <div className="aviso error">Error: {error}</div>}

        <DeckGL initialViewState={VISTA_INICIAL} controller={true} layers={capas}>
          {hover && (
            <div className="tooltip" style={{ left: hover.x + 12, top: hover.y + 12 }}>
              <div><b>Nombre:</b> {hover.object.nombre}</div>
              <div><b>Categoría:</b> {hover.object.categoria}</div>
              <div><b>Valor:</b> {hover.object.valor.toFixed(2)} °C</div>
            </div>
          )}
        </DeckGL>

        <div style={{ position: 'absolute', left: 0, bottom: 0, zIndex: 5, background: 'rgba(255,255,255,.8)', padding: '2px 6px', fontSize: 11 }}>© OpenStreetMap contributors</div>

        <div className="leyenda">
          {Object.entries(COLORES).map(([k, c]) => (
            <div key={k}><i style={{ background: `rgb(${c})` }} /> {k}</div>
          ))}
          <label>
            <input type="checkbox" checked={verCalor} onChange={(e) => setVerCalor(e.target.checked)} />
            {' '}Ver mapa de calor
          </label>
        </div>
      </main>
    </div>
  )
}

