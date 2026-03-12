import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useGame } from "../../context/GameContext";
import { CITIES, WAREHOUSE_LAT_LON, CARRIER_3D } from "../../game/mapConfig";
import { getAllCarriers } from "../../hooks/useCustomCarriers";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const TOP_METROS = ["Mumbai", "Delhi", "Bangalore", "Kolkata"];

function getCarrier(allCarriers, name) {
    return allCarriers.find((c) => c.name === name) || { icon: "📦", color: "#6366f1" };
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
    const dynamicMarkersRef = useRef({}); // Store markers by delivery ID
    const queuedMarkersRef = useRef({}); // Store queue markers by order ID
    const { state } = useGame();
    const { activeDeliveries, warehouseQueue } = state;
    const [loaded, setLoaded] = useState(false);
    
    // Memoize the carriers so we don't fetch from localStorage on every render
    const allCarriers = useMemo(() => getAllCarriers(), [activeDeliveries.length]);
    const routesCacheRef = useRef({});
    const activeRouteIdsRef = useRef(new Set());

    const getCityNameForOrder = useCallback((order) => {
        const citiesInZone = Object.entries(CITIES).filter(([, c]) => c.zone === order.zone);
        if (citiesInZone.length === 0) return "Nagpur";
        const [name] = citiesInZone[order.id % citiesInZone.length];
        return name;
    }, []);

    const activeCityNames = useMemo(() => {
        const names = new Set();
        if (activeDeliveries.length > 0 || warehouseQueue.length > 0) names.add("Nagpur");
        activeDeliveries.forEach(d => names.add(getCityNameForOrder(d)));
        warehouseQueue.forEach(o => names.add(getCityNameForOrder(o)));
        return Array.from(names);
    }, [activeDeliveries, warehouseQueue, getCityNameForOrder]);

    const visibleCityNames = useMemo(() => {
        const names = new Set(TOP_METROS);
        activeCityNames.forEach(n => names.add(n));
        return Array.from(names);
    }, [activeCityNames]);

    const getArcRoute = (start, end) => {
        const coords = [];
        const segments = 100;
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const cx = start[0] + dx / 2;
        const cy = start[1] + dy / 2 + (Math.sqrt(dx * dx + dy * dy) * 0.25);
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const mt = 1 - t;
            coords.push([
                (mt * mt * start[0]) + (2 * mt * t * cx) + (t * t * end[0]),
                (mt * mt * start[1]) + (2 * mt * t * cy) + (t * t * end[1])
            ]);
        }
        return coords;
    };

    const ensureRoute = useCallback(async (hub, dest, carrierName, serviceName) => {
        let mode = "ground";
        if (carrierName && serviceName) {
            const carrierData = getAllCarriers().find(c => c.name === carrierName);
            const serviceData = carrierData?.services?.find(s => s.name === serviceName);
            if (serviceData) mode = serviceData.transportMode || "ground";
        }

        const key = `${hub.join(",")}-${dest.join(",")}-${carrierName}-${mode}`;
        if (routesCacheRef.current[key]) return routesCacheRef.current[key];
        
        const fallback = [hub, dest];
        if (!mapboxgl.accessToken) return fallback;

        if (mode === "air") {
            const arc = getArcRoute(hub, dest);
            return routesCacheRef.current[key] = arc;
        }

        try {
            const carrier = CARRIER_3D[carrierName] || { type: "truck" };
            const profile = carrier.type === "ship" || mode === "sea" ? "walking" : "driving";
            const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/${profile}/${hub[0]},${hub[1]};${dest[0]},${dest[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`);
            const data = await res.json();
            if (data.routes?.[0]) return routesCacheRef.current[key] = data.routes[0].geometry.coordinates;
        } catch (e) { console.error("Route error:", e); }
        return fallback;
    }, []);

    const getPosOnRoute = (coords, progress) => {
        if (!coords || coords.length < 2) return coords?.[0] || [0, 0];
        let totalDist = 0, dists = [];
        for (let i = 0; i < coords.length - 1; i++) {
            const d = Math.sqrt(Math.pow(coords[i+1][0]-coords[i][0],2) + Math.pow(coords[i+1][1]-coords[i][1],2));
            dists.push(d); totalDist += d;
        }
        let target = totalDist * progress, cur = 0;
        for (let i = 0; i < dists.length; i++) {
            if (cur + dists[i] >= target) {
                const f = dists[i] === 0 ? 0 : (target - cur) / dists[i];
                return [coords[i][0] + (coords[i+1][0]-coords[i][0])*f, coords[i][1] + (coords[i+1][1]-coords[i][1])*f];
            }
            cur += dists[i];
        }
        return coords[coords.length - 1];
    };

    useEffect(() => {
        if (mapRef.current) return;
        const m = new mapboxgl.Map({
            container: containerRef.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [78.96, 20.59],
            zoom: 4.5,
            pitch: 35,
            maxBounds: [[65, 5], [100, 38]],
            // backgroundColor: "#000000" // Removed black background for Mapbox
        });

        m.on("load", () => {
            const wv = ["any", ["==", ["get", "worldview"], "all"], ["in", "IN", ["get", "worldview"]]];
            
            // Removed setting map background to absolute black
            // if (m.getLayer('background')) {
            //     m.setPaintProperty('background', 'background-color', '#000000');
            // }

            m.getStyle().layers.forEach(l => {
                if (l.type === "symbol" && !l.id.includes("country-label")) m.setLayoutProperty(l.id, "visibility", "none");
            });

            m.addSource("boundary-src", { type: "vector", url: "mapbox://mapbox.country-boundaries-v1" });
            m.addLayer({ id: "mask", type: "fill", source: "boundary-src", "source-layer": "country_boundaries", filter: ["all", ["!=", ["get", "iso_3166_1"], "IN"], wv], paint: { "fill-color": "#000000", "fill-opacity": 0.95 } });
            m.addLayer({ id: "states", type: "line", source: "composite", "source-layer": "admin", filter: ["all", ["==", ["get", "admin_level"], 1], ["==", ["get", "iso_3166_1"], "IN"], wv], paint: { "line-color": "#38bdf8", "line-width": 0.5, "line-opacity": 0.25 } }, "mask");
            m.addLayer({ id: "border-glow", type: "line", source: "boundary-src", "source-layer": "country_boundaries", filter: ["all", ["==", ["get", "iso_3166_1"], "IN"], wv], paint: { "line-color": "#38bdf8", "line-width": 3, "line-opacity": 0.2, "line-blur": 5 } });
            m.addLayer({ id: "border-line", type: "line", source: "boundary-src", "source-layer": "country_boundaries", filter: ["all", ["==", ["get", "iso_3166_1"], "IN"], wv], paint: { "line-color": "#38bdf8", "line-width": 1.2, "line-opacity": 0.5 } });
            m.addLayer({ id: "fill", type: "fill", source: "boundary-src", "source-layer": "country_boundaries", filter: ["all", ["==", ["get", "iso_3166_1"], "IN"], wv], paint: { "fill-color": "#1e3a5f", "fill-opacity": 0.05 } }, "mask");

            const cityData = Object.entries(CITIES).map(([name, city]) => ({
                type: "Feature", geometry: { type: "Point", coordinates: [city.lon, city.lat] },
                properties: { name, icon: city.icon, isMetro: city.zone === "India Metro" }
            }));
            m.addSource("cities", { type: "geojson", data: { type: "FeatureCollection", features: cityData } });
            m.addLayer({ id: "city-dots", type: "circle", source: "cities", paint: { "circle-color": "#64748b", "circle-radius": 3, "circle-stroke-width": 1, "circle-stroke-color": "#fff" }});
            m.addLayer({ id: "city-labels", type: "symbol", source: "cities", layout: { "text-field": ["get", "name"], "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"], "text-size": 10, "text-anchor": "top", "text-offset": [0, 0.5], "text-allow-overlap": false }, paint: { "text-color": "#94a3b8", "text-halo-color": "#000", "text-halo-width": 1.5 } });
            setLoaded(true);
        });
        mapRef.current = m;
        return () => { m.remove(); mapRef.current = null; };
    }, []);

    useEffect(() => {
        if (!loaded || !mapRef.current) return;
        const m = mapRef.current;
        const filter = ["in", ["get", "name"], ["literal", visibleCityNames]];
        m.setFilter("city-labels", filter); m.setFilter("city-dots", filter);
        const isActive = ["match", ["get", "name"], activeCityNames, true, false];
        m.setPaintProperty("city-labels", "text-color", ["case", isActive, "#f59e0b", "#94a3b8"]);
        m.setPaintProperty("city-labels", "text-halo-width", ["case", isActive, 2.5, 1.5]);
        m.setPaintProperty("city-dots", "circle-color", ["case", isActive, "#f59e0b", "#64748b"]);
        m.setPaintProperty("city-dots", "circle-radius", ["case", isActive, 6, 3]);
    }, [loaded, visibleCityNames, activeCityNames]);

    useEffect(() => {
        if (!loaded || !mapRef.current) return;
        const m = mapRef.current, el = document.createElement("div");
        el.style.cssText = "width:20px;height:20px;background:#f59e0b;border:2px solid #fff;border-radius:4px;box-shadow:0 0 15px #f59e0b;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;";
        el.innerHTML = "📦";
        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat(WAREHOUSE_LAT_LON).addTo(m);
        return () => marker.remove();
    }, [loaded]);

    // Incremental Route & Marker Management (Prevents Blinking)
    useEffect(() => {
        if (!loaded || !mapRef.current) return;
        const m = mapRef.current;

        // 1. Manage Routes (Lines)
        const currentActiveIds = new Set(activeDeliveries.map(d => `rt-${d.id}`));
        activeRouteIdsRef.current.forEach(id => {
            if (!currentActiveIds.has(id)) {
                if (m.getLayer(id+"-g")) m.removeLayer(id+"-g");
                if (m.getLayer(id+"-l")) m.removeLayer(id+"-l");
                if (m.getSource(id)) m.removeSource(id);
            }
        });

        activeDeliveries.forEach(async d => {
            const id = `rt-${d.id}`;
            if (activeRouteIdsRef.current.has(id)) return;
            const dest = getShipmentDest(d);
            const carrier = d.deliveryResult?.carrierName;
            const service = d.deliveryResult?.serviceName;
            const route = await ensureRoute(WAREHOUSE_LAT_LON, dest, carrier, service);
            if (!mapRef.current || !new Set(activeDeliveries.map(ax => `rt-${ax.id}`)).has(id)) return;
            try {
                if (!m.getSource(id)) {
                    m.addSource(id, { 
                        type: "geojson", 
                        data: { type: "Feature", geometry: { type: "LineString", coordinates: route } },
                        tolerance: 0 // Prevents Mapbox from simplifying the line geometry for rendering
                    });
                    m.addLayer({ id: id+"-g", type: "line", source: id, paint: { "line-color": getCarrier(allCarriers, carrier).color, "line-width": 6, "line-opacity": 0.4 } });
                    m.addLayer({ id: id+"-l", type: "line", source: id, paint: { "line-color": getCarrier(allCarriers, carrier).color, "line-width": 2, "line-opacity": 0.9, "line-dasharray": [2, 2] } });
                    activeRouteIdsRef.current.add(id);
                }
            } catch(e){}
        });
        activeRouteIdsRef.current = currentActiveIds;

        // 2. Manage Shipment Markers
        const deliveryIds = new Set(activeDeliveries.map(d => d.id.toString()));
        Object.keys(dynamicMarkersRef.current).forEach(id => {
            if (!deliveryIds.has(id)) { dynamicMarkersRef.current[id].remove(); delete dynamicMarkersRef.current[id]; }
        });

        activeDeliveries.forEach(async d => {
            const id = d.id.toString();
            const carrier = d.deliveryResult?.carrierName;
            const service = d.deliveryResult?.serviceName;
            const route = await ensureRoute(WAREHOUSE_LAT_LON, getShipmentDest(d), carrier, service);
            const timeline = d.trackingTimeline || [];
            
            // ── Movement Logic Fix ──────────────────────────────────────────────
            // Find the index of the "IN_TRANSIT" event in the timeline
            const inTransitIdx = timeline.findIndex(e => e.code === "IN_TRANSIT");
            // Find the index of the "DELIVERED" event (usually the last one)
            const deliveredIdx = timeline.findIndex(e => e.code === "DELIVERED");
            
            // Count how many events from "IN_TRANSIT" onwards have been triggered
            const eventsAfterTransit = timeline.slice(inTransitIdx).filter(e => e.triggered).length;
            const totalTransitEvents = Math.max(1, deliveredIdx - inTransitIdx + 1);
            
            // Only move if IN_TRANSIT has been triggered
            const hasStartedTransit = inTransitIdx !== -1 && timeline[inTransitIdx].triggered;
            
            // Progress is 0 until transit starts, then scales until delivery
            const prog = hasStartedTransit 
                ? Math.min(1, eventsAfterTransit / totalTransitEvents)
                : 0;

            const pos = getPosOnRoute(route, prog);
            
            if (dynamicMarkersRef.current[id]) {
                dynamicMarkersRef.current[id].setLngLat(pos);
            } else {
                let mode = "ground";
                if (carrier && service) {
                    const cData = allCarriers.find(c => c.name === carrier);
                    const sData = cData?.services?.find(s => s.name === service);
                    if (sData) mode = sData.transportMode || "ground";
                }
                const icon = mode === "air" ? "✈️" : (mode === "sea" || CARRIER_3D[carrier]?.type === "ship" ? "🚢" : "🚛");

                const cel = document.createElement("div");
                cel.innerHTML = `<div style="width:12px;height:12px;background:${getCarrier(allCarriers, carrier).color};border-radius:50%;border:1px solid #fff;display:flex;align-items:center;justify-content:center;font-size:6px;box-shadow:0 0 8px #000;">${icon}</div>`;
                dynamicMarkersRef.current[id] = new mapboxgl.Marker({ element: cel }).setLngLat(pos).addTo(m);
            }
        });

        // 3. Manage Queue Markers
        const queueIds = new Set(warehouseQueue.map(o => o.id.toString()));
        Object.keys(queuedMarkersRef.current).forEach(id => {
            if (!queueIds.has(id)) { queuedMarkersRef.current[id].remove(); delete queuedMarkersRef.current[id]; }
        });
        warehouseQueue.forEach(order => {
            const id = order.id.toString();
            if (!queuedMarkersRef.current[id]) {
                const el = document.createElement("div");
                el.innerHTML = `<div style="width:6px;height:6px;background:#f59e0b;border-radius:50%;box-shadow:0 0 6px #f59e0b;animation:pulse-marker 2s infinite;"></div>`;
                queuedMarkersRef.current[id] = new mapboxgl.Marker({ element: el }).setLngLat(getShipmentDest(order)).addTo(m);
            }
        });
    }, [loaded, activeDeliveries, warehouseQueue, ensureRoute]);

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
            <div style={{ position: "absolute", bottom: 12, left: 12, pointerEvents: "none", background: "rgba(10,15,26,0.9)", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", display: "flex", gap: 12, fontSize: 10, color: "#94a3b8" }}>
                <span><span style={{ color: "#38bdf8" }}>●</span> India</span>
                <span><span style={{ color: "#f59e0b" }}>●</span> Active</span>
                <span><span style={{ color: "#64748b" }}>●</span> Metros</span>
            </div>
        </div>
    );
}
