import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Droplets, Wind, Building2, Satellite, Map as MapIcon } from 'lucide-react';

// Lazy load MapLibre GL JS (no token required) with OSM + ESRI raster layers
const MAPLIBRE_JS = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
const MAPLIBRE_CSS = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
function loadCSS(href) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return resolve();
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = () => resolve();
    l.onerror = reject;
    document.head.appendChild(l);
  });
}

// Mock GeoJSON zones around Delhi
const zones = [
  {
    id: 'north-delhi',
    name: 'North Delhi',
    aqi: 62,
    water: 58,
    infra: 70,
    polygon: [
      [77.12, 28.80], [77.25, 28.80], [77.25, 28.75], [77.12, 28.75], [77.12, 28.80]
    ],
  },
  {
    id: 'central-delhi',
    name: 'Central Delhi',
    aqi: 48,
    water: 66,
    infra: 78,
    polygon: [
      [77.17, 28.70], [77.27, 28.70], [77.27, 28.62], [77.17, 28.62], [77.17, 28.70]
    ],
  },
  {
    id: 'south-delhi',
    name: 'South Delhi',
    aqi: 38,
    water: 52,
    infra: 74,
    polygon: [
      [77.15, 28.58], [77.30, 28.58], [77.30, 28.48], [77.15, 28.48], [77.15, 28.58]
    ],
  },
  {
    id: 'east-delhi',
    name: 'East Delhi',
    aqi: 55,
    water: 44,
    infra: 68,
    polygon: [
      [77.30, 28.68], [77.38, 28.68], [77.38, 28.58], [77.30, 28.58], [77.30, 28.68]
    ],
  },
];

function computeRES(a, w, i) {
  return Math.round(a * 0.4 + w * 0.3 + i * 0.3);
}

function asGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => ({
      type: 'Feature',
      properties: {
        id: z.id,
        name: z.name,
        aqi: z.aqi,
        water: z.water,
        infra: z.infra,
        res: computeRES(z.aqi, z.water, z.infra),
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[...z.polygon]],
      },
    })),
  };
}

function centroid(coords) {
  // coords: [[lng, lat], ...]
  let x = 0, y = 0, z = 0;
  coords.forEach(([lng, lat]) => {
    x += lng; y += lat; z += 1;
  });
  return [x / z, y / z];
}

function Gauge({ value }) {
  const clamped = Math.max(0, Math.min(100, value));
  const progress = useSpring(0, { stiffness: 80, damping: 20 });
  useEffect(() => { progress.set(clamped); }, [clamped, progress]);

  const circumference = 2 * Math.PI * 56; // r=56
  const dashOffset = useTransform(progress, [0, 100], [circumference, 0]);

  let statusColor = 'stroke-emerald-400';
  if (clamped < 40) statusColor = 'stroke-red-400';
  else if (clamped < 60) statusColor = 'stroke-amber-400';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" viewBox="0 0 160 160" className="rotate-[-90deg]">
        <circle cx="80" cy="80" r="56" className="stroke-zinc-800" strokeWidth="14" fill="none" />
        <motion.circle
          cx="80" cy="80" r="56" strokeWidth="14" fill="none"
          className={statusColor}
          strokeLinecap="round"
          style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-semibold">{clamped}</div>
        <div className="text-xs text-zinc-400 tracking-wider">RES</div>
      </div>
    </div>
  );
}

export default function MapPanel() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [base, setBase] = useState('osm');
  const [selected, setSelected] = useState(null);

  const geojson = useMemo(() => asGeoJSON(), []);

  const overall = useMemo(() => {
    const vals = geojson.features.map(f => f.properties.res);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [geojson]);

  const airAvg = useMemo(() => Math.round(geojson.features.reduce((a, f) => a + f.properties.aqi, 0) / geojson.features.length), [geojson]);
  const waterAvg = useMemo(() => Math.round(geojson.features.reduce((a, f) => a + f.properties.water, 0) / geojson.features.length), [geojson]);
  const infraAvg = useMemo(() => Math.round(geojson.features.reduce((a, f) => a + f.properties.infra, 0) / geojson.features.length), [geojson]);

  // Load maplibre
  useEffect(() => {
    let map;
    let popup;
    let cycleTimer;

    async function init() {
      await loadCSS(MAPLIBRE_CSS);
      await loadScript(MAPLIBRE_JS);
      const maplibregl = window.maplibregl;
      if (!maplibregl) return;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap'
            },
            esri: {
              type: 'raster',
              tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256,
              attribution: 'Tiles © Esri'
            },
            zones: {
              type: 'geojson',
              data: geojson
            }
          },
          layers: [
            { id: 'esri', type: 'raster', source: 'esri', layout: { visibility: base === 'sat' ? 'visible' : 'none' } },
            { id: 'osm', type: 'raster', source: 'osm', layout: { visibility: base === 'sat' ? 'none' : 'visible' } },
            {
              id: 'zones-fill', type: 'fill', source: 'zones',
              paint: {
                'fill-color': [
                  'interpolate', ['linear'], ['get', 'res'],
                  30, '#ef4444',
                  50, '#f59e0b',
                  70, '#22c55e',
                  90, '#10b981'
                ],
                'fill-opacity': 0.45
              }
            },
            {
              id: 'zones-outline', type: 'line', source: 'zones',
              paint: {
                'line-color': '#a1a1aa',
                'line-width': 1.2
              }
            },
            {
              id: 'zones-outline-selected', type: 'line', source: 'zones',
              filter: ['==', ['get', 'id'], ''],
              paint: {
                'line-color': '#22c55e',
                'line-width': 3,
                'line-blur': 1
              }
            }
          ]
        },
        center: [77.209, 28.6139],
        zoom: 10.3,
        minZoom: 9,
        maxZoom: 16,
        attributionControl: true,
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

      popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

      map.on('mousemove', 'zones-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features && e.features[0];
        if (!f) return;
        const p = f.properties;
        const html = `<div style="font-family: Inter, ui-sans-serif;">
          <div style="font-weight:600;margin-bottom:4px">${p.name}</div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:12px;color:#d4d4d8">
            <span>Air</span><span><strong>${p.aqi}</strong></span>
            <span>Water</span><span><strong>${p.water}</strong></span>
            <span>Infra</span><span><strong>${p.infra}</strong></span>
            <span>RES</span><span><strong>${p.res}</strong></span>
          </div>
        </div>`;
        popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      });
      map.on('mouseleave', 'zones-fill', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      map.on('click', 'zones-fill', (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const p = f.properties;
        setSelected(p.id);
        map.setFilter('zones-outline-selected', ['==', ['get', 'id'], p.id]);
        map.flyTo({ center: e.lngLat, zoom: 11.4, speed: 0.6, curve: 1.7 });
      });

      // Auto focus cycle across zones
      const centers = geojson.features.map((f) => centroid(f.geometry.coordinates[0]));
      let idx = 0;
      cycleTimer = setInterval(() => {
        if (!map) return;
        const [lng, lat] = centers[idx % centers.length];
        map.flyTo({ center: [lng, lat], zoom: 11, speed: 0.3, curve: 1.4, essential: false });
        idx++;
      }, 6000);

      setMapReady(true);
      mapRef.current = map;
    }

    init();

    return () => {
      if (popup) popup.remove();
      if (mapRef.current) mapRef.current.remove();
      if (cycleTimer) clearInterval(cycleTimer);
      mapRef.current = null;
    };
  }, [geojson, base]);

  // Toggle base layer visibility when base changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const visSat = base === 'sat' ? 'visible' : 'none';
    const visOsm = base === 'sat' ? 'none' : 'visible';
    if (map.getLayer('esri')) map.setLayoutProperty('esri', 'visibility', visSat);
    if (map.getLayer('osm')) map.setLayoutProperty('osm', 'visibility', visOsm);
  }, [base, mapReady]);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
      <div className="relative rounded-2xl overflow-hidden bg-zinc-900 ring-1 ring-zinc-800/70">
        <div ref={containerRef} className="h-[520px] w-full" />
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-zinc-900/70 backdrop-blur rounded-full p-1 ring-1 ring-zinc-700/70">
          <button
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${base === 'osm' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-white'}`}
            onClick={() => setBase('osm')}
            title="Street Map"
          >
            <div className="inline-flex items-center gap-1"><MapIcon size={14}/> Street</div>
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${base === 'sat' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-white'}`}
            onClick={() => setBase('sat')}
            title="Satellite"
          >
            <div className="inline-flex items-center gap-1"><Satellite size={14}/> Satellite</div>
          </button>
        </div>
      </div>

      <aside className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800/70 p-5 flex flex-col gap-6">
        <div>
          <div className="text-sm uppercase tracking-wider text-zinc-400">Resource Equity Score</div>
          <div className="mt-3 flex items-center gap-4">
            <Gauge value={overall} />
            <div className="text-sm text-zinc-300 leading-relaxed">
              <div>Composite of city health indicators.</div>
              <div className="mt-1 text-zinc-400">Weighted: Air 40%, Water 30%, Infra 30%</div>
              {selected && (
                <div className="mt-2 inline-flex items-center gap-2 text-emerald-400/90">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/>
                  Focused on: <span className="font-medium capitalize">{String(selected).replace('-', ' ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MetricCard title="Air Quality" icon={<Wind size={16} />} value={airAvg} color="from-emerald-400/70 to-teal-400/70" />
          <MetricCard title="Water" icon={<Droplets size={16} />} value={waterAvg} color="from-sky-400/70 to-cyan-400/70" />
          <MetricCard title="Infrastructure" icon={<Building2 size={16} />} value={infraAvg} color="from-purple-400/70 to-fuchsia-400/70" />
        </div>

        <div className="space-y-3">
          {zones.map((z) => (
            <BarRow key={z.id} name={z.name} value={computeRES(z.aqi, z.water, z.infra)} onFocus={() => {
              const map = mapRef.current;
              if (!map) return;
              setSelected(z.id);
              map.setFilter('zones-outline-selected', ['==', ['get', 'id'], z.id]);
              const [lng, lat] = centroid(z.polygon);
              map.flyTo({ center: [lng, lat], zoom: 11.2, speed: 0.5 });
            }} />
          ))}
        </div>
      </aside>
    </section>
  );
}

function MetricCard({ title, icon, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
      className="rounded-xl bg-zinc-950/50 ring-1 ring-zinc-800/70 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-zinc-400 flex items-center gap-1.5">{icon}{title}</div>
        <div className="text-sm text-zinc-300">{value}</div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className={`h-full bg-gradient-to-r ${color}`}
        />
      </div>
    </motion.div>
  );
}

function BarRow({ name, value, onFocus }) {
  const pct = Math.max(0, Math.min(100, value));
  let barColor = 'from-emerald-500 to-emerald-400';
  if (pct < 40) barColor = 'from-red-500 to-rose-500';
  else if (pct < 60) barColor = 'from-amber-500 to-yellow-400';
  return (
    <button onClick={onFocus} className="w-full text-left group">
      <div className="flex items-center justify-between text-sm">
        <div className="text-zinc-300">{name}</div>
        <div className="text-zinc-400 group-hover:text-zinc-200 transition-colors">{pct}</div>
      </div>
      <div className="mt-2 h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className={`h-full bg-gradient-to-r ${barColor}`} />
      </div>
    </button>
  );
}
