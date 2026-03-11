import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useGame } from "../../context/GameContext";
import { CITIES, WAREHOUSE_LAT_LON } from "../../game/mapConfig";
import { CARRIERS } from "../../game/constants";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function getCarrier(name) {
    return CARRIERS.find((c) => c.name === name) || { icon: "📦", color: "#6366f1" };
}

function getShipmentDest(item) {
    const cities = Object.entries(CITIES).filter(([, c]) => c.zone === item.zone);
    if (cities.length === 0) return WAREHOUSE_LAT_LON;
    const [, city] = cities[item.id % cities.length];
    return [city.lon, city.lat];
}

export default function MapboxMap() {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const dynamicMarkersRef = useRef([]);
    const { state } = useGame();
    const { activeDeliveries, warehouseQueue } = state;
    const [loaded, setLoaded] = useState(false);

    // Init map
    useEffect(() => {
        if (mapRef.current) return;

        const m = new mapboxgl.Map({
            container: containerRef.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [79.5, 22.0],
            zoom: 4.8,
            pitch: 40,
            bearing: 0,
            antialias: true,
            maxBounds: [[66, 6], [98, 36]],
            minZoom: 4,
            maxZoom: 14,
        });

        m.on("load", () => {
            // ---- Use Mapbox's official country boundaries for accurate borders ----
            m.addSource("country-boundaries", {
                type: "vector",
                url: "mapbox://mapbox.country-boundaries-v1",
            });

            // Dark mask over ALL non-India countries
            m.addLayer({
                id: "non-india-mask",
                type: "fill",
                source: "country-boundaries",
                "source-layer": "country_boundaries",
                filter: ["!=", ["get", "iso_3166_1"], "IN"],
                paint: {
                    "fill-color": "#080c14",
                    "fill-opacity": 0.88,
                },
            });

            // India border highlight (glow)
            m.addLayer({
                id: "india-border-glow",
                type: "line",
                source: "country-boundaries",
                "source-layer": "country_boundaries",
                filter: ["==", ["get", "iso_3166_1"], "IN"],
                paint: {
                    "line-color": "#38bdf8",
                    "line-width": 4,
                    "line-opacity": 0.25,
                    "line-blur": 4,
                },
            });

            // India border crisp line
            m.addLayer({
                id: "india-border-line",
                type: "line",
                source: "country-boundaries",
                "source-layer": "country_boundaries",
                filter: ["==", ["get", "iso_3166_1"], "IN"],
                paint: {
                    "line-color": "#38bdf8",
                    "line-width": 1.5,
                    "line-opacity": 0.6,
                },
            });

            // India subtle fill highlight
            m.addLayer({
                id: "india-fill",
                type: "fill",
                source: "country-boundaries",
                "source-layer": "country_boundaries",
                filter: ["==", ["get", "iso_3166_1"], "IN"],
                paint: {
                    "fill-color": "#1e3a5f",
                    "fill-opacity": 0.08,
                },
            });

            // 3D buildings when zoomed in
            const layers = m.getStyle().layers;
            const labelId = layers.find(
                (l) => l.type === "symbol" && l.layout && l.layout["text-field"]
            )?.id;

            if (labelId) {
                m.addLayer({
                    id: "3d-buildings",
                    source: "composite",
                    "source-layer": "building",
                    filter: ["==", "extrude", "true"],
                    type: "fill-extrusion",
                    minzoom: 12,
                    paint: {
                        "fill-extrusion-color": "#1e293b",
                        "fill-extrusion-height": ["get", "height"],
                        "fill-extrusion-base": ["get", "min_height"],
                        "fill-extrusion-opacity": 0.7,
                    },
                }, labelId);
            }

            // Sky
            m.addLayer({
                id: "sky",
                type: "sky",
                paint: {
                    "sky-type": "atmosphere",
                    "sky-atmosphere-sun": [0.0, 90.0],
                    "sky-atmosphere-sun-intensity": 5,
                },
            });

            setLoaded(true);
        });

        m.addControl(new mapboxgl.NavigationControl(), "top-right");
        mapRef.current = m;

        return () => {
            m.remove();
            mapRef.current = null;
        };
    }, []);

    // Static city + hub markers
    useEffect(() => {
        if (!loaded || !mapRef.current) return;
        const m = mapRef.current;

        Object.entries(CITIES).forEach(([name, city]) => {
            const isMetro = city.zone === "India Metro";
            const color = city.zone === "India Metro" ? "#06b6d4"
                : city.zone === "India Tier-2" ? "#22c55e" : "#d97706";

            const el = document.createElement("div");
            el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
            el.innerHTML = `
        <span style="font-size:${isMetro ? 11 : 9}px;font-weight:${isMetro ? 700 : 500};color:#e2e8f0;text-shadow:0 1px 4px #000,0 0 8px #000;font-family:'Segoe UI',system-ui,sans-serif;margin-bottom:2px;white-space:nowrap;">${city.icon} ${name}</span>
        <div style="width:${isMetro ? 12 : 7}px;height:${isMetro ? 12 : 7}px;background:${color};border-radius:50%;border:${isMetro ? "2px" : "1px"} solid rgba(255,255,255,0.3);box-shadow:0 0 ${isMetro ? 12 : 6}px ${color};"></div>
      `;

            new mapboxgl.Marker({ element: el, anchor: "bottom" })
                .setLngLat([city.lon, city.lat])
                .addTo(m);
        });

        // Hub
        const hub = document.createElement("div");
        hub.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
        hub.innerHTML = `
      <span style="font-size:12px;font-weight:700;color:#f59e0b;text-shadow:0 1px 4px #000,0 0 8px #000;font-family:'Segoe UI',system-ui,sans-serif;margin-bottom:3px;white-space:nowrap;">📦 Centiro Hub</span>
      <div style="width:18px;height:18px;background:#f59e0b;border-radius:4px;border:2px solid #fff;box-shadow:0 0 15px #f59e0b;display:flex;align-items:center;justify-content:center;font-size:12px;">📦</div>
    `;
        new mapboxgl.Marker({ element: hub, anchor: "bottom" })
            .setLngLat(WAREHOUSE_LAT_LON)
            .addTo(m);
    }, [loaded]);

    const clearDynamic = useCallback(() => {
        dynamicMarkersRef.current.forEach((mk) => mk.remove());
        dynamicMarkersRef.current = [];
    }, []);

    // Dynamic delivery routes + queued
    useEffect(() => {
        if (!loaded || !mapRef.current) return;
        const m = mapRef.current;
        clearDynamic();

        // Remove old routes
        try {
            const style = m.getStyle();
            if (style?.layers) {
                style.layers.forEach((l) => {
                    if (l.id.startsWith("rt-")) m.removeLayer(l.id);
                });
            }
            if (style?.sources) {
                Object.keys(style.sources).forEach((s) => {
                    if (s.startsWith("rt-")) m.removeSource(s);
                });
            }
        } catch (e) { /* ok */ }

        const hub = WAREHOUSE_LAT_LON;

        activeDeliveries.forEach((d) => {
            const dest = getShipmentDest(d);
            const carrier = getCarrier(d.deliveryResult?.carrierName);
            const id = `rt-${d.id}`;

            const tl = d.trackingTimeline || [];
            const prog = Math.min(1, tl.filter((e) => e.triggered).length / Math.max(1, tl.length));
            const cur = [hub[0] + (dest[0] - hub[0]) * prog, hub[1] + (dest[1] - hub[1]) * prog];

            try {
                m.addSource(id, {
                    type: "geojson",
                    data: { type: "Feature", geometry: { type: "LineString", coordinates: [hub, dest] } },
                });
                m.addLayer({ id: id + "-g", type: "line", source: id, paint: { "line-color": carrier.color, "line-width": 5, "line-opacity": 0.2, "line-blur": 3 } });
                m.addLayer({ id: id + "-l", type: "line", source: id, paint: { "line-color": carrier.color, "line-width": 2, "line-opacity": 0.85, "line-dasharray": [2, 2] } });
            } catch (e) { /* dup */ }

            const cel = document.createElement("div");
            cel.innerHTML = `<div style="width:14px;height:14px;background:${carrier.color};border-radius:50%;border:2px solid #fff;box-shadow:0 0 10px ${carrier.color};display:flex;align-items:center;justify-content:center;font-size:7px;">🚛</div>`;
            dynamicMarkersRef.current.push(new mapboxgl.Marker({ element: cel }).setLngLat(cur).addTo(m));
        });

        warehouseQueue.forEach((order) => {
            const dest = getShipmentDest(order);
            const color = order.zone === "India Metro" ? "#06b6d4" : order.zone === "India Tier-2" ? "#22c55e" : "#d97706";
            const el = document.createElement("div");
            el.innerHTML = `<div style="width:7px;height:7px;background:${color};border-radius:50%;animation:pulse-marker 2s infinite;box-shadow:0 0 6px ${color};"></div>`;
            dynamicMarkersRef.current.push(new mapboxgl.Marker({ element: el }).setLngLat(dest).addTo(m));
        });
    }, [loaded, activeDeliveries, warehouseQueue, clearDynamic]);

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
            <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 10, pointerEvents: "none", background: "rgba(10,15,26,0.9)", border: "1px solid #334155", borderRadius: 8, padding: "8px 14px", display: "flex", gap: 14, fontSize: 11, fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#94a3b8" }}>
                <span><span style={{ color: "#06b6d4" }}>●</span> Metro</span>
                <span><span style={{ color: "#22c55e" }}>●</span> Tier-2</span>
                <span><span style={{ color: "#d97706" }}>●</span> Rural</span>
                <span><span style={{ color: "#f59e0b" }}>■</span> Hub</span>
            </div>
            <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, pointerEvents: "none", background: "rgba(10,15,26,0.9)", border: "1px solid #334155", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#e2e8f0" }}>
                🚛 {activeDeliveries.length} in transit · 📋 {warehouseQueue.length} queued
            </div>
        </div>
    );
}
