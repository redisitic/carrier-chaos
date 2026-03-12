import { useState } from "react";
import { useCustomCarriers } from "../hooks/useCustomCarriers";
import { CARRIERS } from "../game/constants";
import CarrierLogo from "./CarrierLogo";

const SLA_OPTIONS = ["same-day", "next-day", "3-5 day", "5-7 day"];
const ZONE_OPTIONS = ["India Metro", "India Tier-2", "India Rural"];
const TRANSPORT_MODES = ["air", "ground", "sea"];

const EMPTY_SERVICE = {
  name: "",
  sla: "next-day",
  transportMode: "ground",
  costPerKg: 80,
  zones: ["India Metro"],
  dg: false,
  maxWeight: 30,
  desc: "",
};

const EMPTY_CARRIER = {
  name: "",
  icon: "📦",
  color: "#6366f1",
  reliability: 0.93,
  lore: "",
  pros: [""],
  cons: [""],
  services: [{ ...EMPTY_SERVICE }],
};

function ServiceForm({ service, onChange, onRemove, index }) {
  const update = (field, val) => onChange({ ...service, [field]: val });

  const toggleZone = (zone) => {
    const next = service.zones.includes(zone)
      ? service.zones.filter((z) => z !== zone)
      : [...service.zones, zone];
    update("zones", next);
  };

  return (
    <div className="cp-service-row">
      <div className="cp-service-title">
        <span className="cp-service-num">Service {index + 1}</span>
        <button className="cp-remove-btn" onClick={onRemove}>✕ Remove</button>
      </div>
      <div className="cp-field-grid">
        <div className="cp-field">
          <label>Name</label>
          <input value={service.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Express Air" />
        </div>
        <div className="cp-field">
          <label>SLA</label>
          <select value={service.sla} onChange={e => update("sla", e.target.value)}>
            {SLA_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>Transport Mode</label>
          <select value={service.transportMode} onChange={e => update("transportMode", e.target.value)}>
            {TRANSPORT_MODES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>Cost / kg (₹)</label>
          <input type="number" value={service.costPerKg} onChange={e => update("costPerKg", +e.target.value)} min={1} />
        </div>
        <div className="cp-field">
          <label>Max Weight (kg)</label>
          <input type="number" value={service.maxWeight} onChange={e => update("maxWeight", +e.target.value)} min={1} />
        </div>
        <div className="cp-field cp-field-inline">
          <label>DG Capable</label>
          <input type="checkbox" checked={service.dg} onChange={e => update("dg", e.target.checked)} />
        </div>
      </div>
      <div className="cp-field">
        <label>Zones</label>
        <div className="cp-zone-checks">
          {ZONE_OPTIONS.map(z => (
            <label key={z} className="cp-zone-check">
              <input type="checkbox" checked={service.zones.includes(z)} onChange={() => toggleZone(z)} />
              {z}
            </label>
          ))}
        </div>
      </div>
      <div className="cp-field">
        <label>Description</label>
        <textarea rows={2} value={service.desc} onChange={e => update("desc", e.target.value)} placeholder="Service description shown on dispatch screen" />
      </div>
    </div>
  );
}

function ManualTab({ initial, onSave, editIndex, onCancelEdit }) {
  const [form, setForm] = useState(initial || { ...EMPTY_CARRIER, pros: [""], cons: [""], services: [{ ...EMPTY_SERVICE }] });

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateList = (field, idx, val) => {
    const arr = [...form[field]];
    arr[idx] = val;
    setField(field, arr);
  };
  const addListItem = (field) => setField(field, [...form[field], ""]);
  const removeListItem = (field, idx) => setField(field, form[field].filter((_, i) => i !== idx));

  const updateService = (idx, svc) => {
    const arr = [...form.services];
    arr[idx] = svc;
    setField("services", arr);
  };
  const addService = () => setField("services", [...form.services, { ...EMPTY_SERVICE }]);
  const removeService = (idx) => setField("services", form.services.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (!form.name.trim()) return alert("Carrier name is required");
    if (form.services.length === 0) return alert("Add at least one service");
    onSave({ ...form, pros: form.pros.filter(Boolean), cons: form.cons.filter(Boolean) });
    setForm({ ...EMPTY_CARRIER, pros: [""], cons: [""], services: [{ ...EMPTY_SERVICE }] });
  };

  return (
    <div className="cp-manual">
      <div className="cp-section">
        <h3 className="cp-section-title">Carrier Details</h3>
        <div className="cp-field-grid">
          <div className="cp-field cp-field-wide">
            <label>Name *</label>
            <input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="e.g. DTDC" />
          </div>
          <div className="cp-field">
            <label>Icon (emoji)</label>
            <input value={form.icon} onChange={e => setField("icon", e.target.value)} placeholder="📦" maxLength={4} className="cp-emoji-input" />
          </div>
          <div className="cp-field">
            <label>Brand Color</label>
            <div className="cp-color-row">
              <input type="color" value={form.color} onChange={e => setField("color", e.target.value)} className="cp-color-picker" />
              <input value={form.color} onChange={e => setField("color", e.target.value)} placeholder="#6366f1" className="cp-color-text" />
            </div>
          </div>
          <div className="cp-field">
            <label>Reliability ({Math.round(form.reliability * 100)}%)</label>
            <input type="range" min={0.5} max={1} step={0.01} value={form.reliability} onChange={e => setField("reliability", +e.target.value)} />
          </div>
        </div>
        <div className="cp-field">
          <label>Lore / Description</label>
          <textarea rows={2} value={form.lore} onChange={e => setField("lore", e.target.value)} placeholder="Carrier backstory shown in the Dark Souls tooltip..." />
        </div>
        <div className="cp-pros-cons">
          <div className="cp-field">
            <label>Pros</label>
            {form.pros.map((p, i) => (
              <div key={i} className="cp-list-row">
                <input value={p} onChange={e => updateList("pros", i, e.target.value)} placeholder="Pro..." />
                <button className="cp-icon-btn" onClick={() => removeListItem("pros", i)}>✕</button>
              </div>
            ))}
            <button className="cp-add-btn" onClick={() => addListItem("pros")}>+ Add Pro</button>
          </div>
          <div className="cp-field">
            <label>Cons</label>
            {form.cons.map((c, i) => (
              <div key={i} className="cp-list-row">
                <input value={c} onChange={e => updateList("cons", i, e.target.value)} placeholder="Con..." />
                <button className="cp-icon-btn" onClick={() => removeListItem("cons", i)}>✕</button>
              </div>
            ))}
            <button className="cp-add-btn" onClick={() => addListItem("cons")}>+ Add Con</button>
          </div>
        </div>
      </div>

      <div className="cp-section">
        <h3 className="cp-section-title">Services</h3>
        {form.services.map((svc, i) => (
          <ServiceForm
            key={i}
            index={i}
            service={svc}
            onChange={(v) => updateService(i, v)}
            onRemove={() => removeService(i)}
          />
        ))}
        <button className="cp-add-btn" onClick={addService}>+ Add Service</button>
      </div>

      <div className="cp-actions">
        {editIndex != null && <button className="cp-cancel-btn" onClick={onCancelEdit}>Cancel</button>}
        <button className="cp-save-btn" onClick={handleSave}>
          {editIndex != null ? "💾 Update Carrier" : "💾 Save Carrier"}
        </button>
      </div>
    </div>
  );
}

function GeminiTab({ onPopulate }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawJson, setRawJson] = useState(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const PROMPT = `You are a logistics data extractor. Given the text below about a carrier or logistics company, extract a JSON object with this exact structure:
{
  "name": "string",
  "icon": "one emoji",
  "color": "#hexcolor (brand color or a fitting one)",
  "reliability": "number 0.0-1.0",
  "lore": "string - 2-3 sentences about the carrier",
  "pros": ["string", ...],
  "cons": ["string", ...],
  "services": [
    {
      "name": "string",
      "sla": "same-day | next-day | 3-5 day | 5-7 day",
      "transportMode": "air | ground | sea",
      "costPerKg": number,
      "zones": ["India Metro", "India Tier-2", "India Rural"] (subset),
      "dg": boolean,
      "maxWeight": number,
      "desc": "string - one sentence"
    }
  ]
}
Return ONLY valid JSON, no markdown, no explanation. If you cannot extract a field, use a sensible default.`;

  const runGemini = async (content) => {
    if (!apiKey) {
      setError("VITE_GEMINI_API_KEY not set in .env file.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: PROMPT + "\n\nInput:\n" + content }] }]
          }),
        }
      );
      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // Strip possible markdown code fences
      const json = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(json);
      setRawJson(json);
      onPopulate(parsed);
    } catch (e) {
      setError(e.message || "Failed to parse Gemini response.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target.result);
    reader.readAsText(f);
  };

  const handleGenerate = () => {
    const content = text.trim();
    if (!content) return setError("Enter some text or upload a file first.");
    runGemini(content);
  };

  return (
    <div className="cp-gemini">
      <div className="cp-gemini-header">
        <div className="cp-gemini-icon">✨</div>
        <div>
          <h3>AI Carrier Builder</h3>
          <p>Paste carrier info, upload a .txt or .pdf, then let Gemini fill the form.</p>
        </div>
      </div>

      {!apiKey && (
        <div className="cp-gemini-warn">
          ⚠ <strong>VITE_GEMINI_API_KEY</strong> not set. Add it to your <code>.env</code> file and restart the dev server.
        </div>
      )}

      <div className="cp-field">
        <label>Upload .txt or .pdf</label>
        <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} className="cp-file-input" />
        {file && <span className="cp-file-name">📄 {file.name}</span>}
      </div>

      <div className="cp-field">
        <label>Or paste text directly</label>
        <textarea
          rows={8}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste carrier brochure, wikipedia text, rate card, or any description..."
          className="cp-gemini-textarea"
        />
      </div>

      {error && <div className="cp-error">{error}</div>}

      <button className="cp-gemini-btn" onClick={handleGenerate} disabled={loading}>
        {loading ? "⏳ Generating…" : "✨ Generate with Gemini"}
      </button>

      {rawJson && (
        <div className="cp-gemini-result">
          <div className="cp-gemini-result-header">
            ✅ Form populated from AI — review & edit in the Manual tab, then Save.
          </div>
          <details>
            <summary className="cp-json-toggle">View raw JSON</summary>
            <pre className="cp-json-pre">{rawJson}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

function CarrierCard({ carrier, onEdit, onDelete, isBuiltIn }) {
  return (
    <div className="cp-carrier-card" style={{ borderColor: carrier.color + "55" }}>
      <div className="cp-cc-header">
        <span className="cp-cc-icon" style={{ color: carrier.color }}>
          <CarrierLogo name={carrier.name} size={18} />
        </span>
        <span className="cp-cc-name" style={{ color: carrier.color }}>{carrier.name}</span>
        {isBuiltIn && <span className="cp-cc-builtin">Built-in</span>}
        {!isBuiltIn && (
          <div className="cp-cc-actions">
            <button className="cp-cc-btn" onClick={onEdit}>✏</button>
            <button className="cp-cc-btn danger" onClick={onDelete}>🗑</button>
          </div>
        )}
      </div>
      <div className="cp-cc-meta">
        <span>⚡ {Math.round(carrier.reliability * 100)}% reliability</span>
        <span>🛠 {carrier.services?.length || 0} services</span>
      </div>
      <div className="cp-cc-services">
        {carrier.services?.map(s => (
          <span key={s.name} className="cp-cc-svc">{s.name} · {s.sla}</span>
        ))}
      </div>
    </div>
  );
}

export default function CarriersPage() {
  const { customCarriers, addCarrier, updateCarrier, removeCarrier } = useCustomCarriers();
  const [activeTab, setActiveTab] = useState("manual");
  const [editIndex, setEditIndex] = useState(null);
  const [manualInitial, setManualInitial] = useState(null);

  const handleSave = (carrier) => {
    if (editIndex != null) {
      updateCarrier(editIndex, carrier);
      setEditIndex(null);
      setManualInitial(null);
    } else {
      addCarrier(carrier);
    }
  };

  const handleEdit = (idx) => {
    setEditIndex(idx);
    setManualInitial({ ...customCarriers[idx] });
    setActiveTab("manual");
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setManualInitial(null);
  };

  const handleGeminiPopulate = (carrier) => {
    setManualInitial({
      ...carrier,
      pros: carrier.pros?.length ? carrier.pros : [""],
      cons: carrier.cons?.length ? carrier.cons : [""],
      services: carrier.services?.length ? carrier.services : [{ ...EMPTY_SERVICE }],
    });
    setEditIndex(null);
    setActiveTab("manual");
  };

  return (
    <div className="screen carriers-page">
      <div className="cp-layout">
        {/* Left: form */}
        <div className="cp-left">
          <div className="cp-header">
            <h2 className="cp-title">Carrier Manager</h2>
            <p className="cp-subtitle">Add custom carriers that appear in gameplay alongside built-in ones.</p>
          </div>

          <div className="cp-tabs">
            <button className={`cp-tab ${activeTab === "manual" ? "active" : ""}`} onClick={() => setActiveTab("manual")}>
              ✏ Manual
            </button>
            <button className={`cp-tab ${activeTab === "gemini" ? "active" : ""}`} onClick={() => setActiveTab("gemini")}>
              ✨ Gemini AI
            </button>
          </div>

          {activeTab === "manual" && (
            <ManualTab
              key={editIndex ?? "new"}
              initial={manualInitial}
              onSave={handleSave}
              editIndex={editIndex}
              onCancelEdit={handleCancelEdit}
            />
          )}
          {activeTab === "gemini" && <GeminiTab onPopulate={handleGeminiPopulate} />}
        </div>

        {/* Right: carrier list */}
        <div className="cp-right">
          <h3 className="cp-list-title">All Carriers ({CARRIERS.length + customCarriers.length})</h3>

          {customCarriers.length > 0 && (
            <div className="cp-carrier-section">
              <div className="cp-carrier-section-label">Custom ({customCarriers.length})</div>
              {customCarriers.map((c, i) => (
                <CarrierCard
                  key={i}
                  carrier={c}
                  onEdit={() => handleEdit(i)}
                  onDelete={() => removeCarrier(i)}
                  isBuiltIn={false}
                />
              ))}
            </div>
          )}

          <div className="cp-carrier-section">
            <div className="cp-carrier-section-label">Built-in ({CARRIERS.length})</div>
            {CARRIERS.map((c) => (
              <CarrierCard key={c.name} carrier={c} isBuiltIn />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .carriers-page {
          overflow-y: auto;
          background: var(--bg);
          padding: calc(var(--hud-h) + 16px) 16px 24px;
        }
        .cp-layout {
          display: flex;
          gap: 20px;
          max-width: 1100px;
          margin: 0 auto;
          align-items: flex-start;
        }
        .cp-left {
          flex: 1;
          min-width: 0;
        }
        .cp-right {
          width: 280px;
          flex-shrink: 0;
        }
        .cp-header { margin-bottom: 16px; }
        .cp-title { font-size: 1.3rem; font-weight: 800; color: var(--text); margin: 0; }
        .cp-subtitle { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }

        .cp-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 4px;
        }
        .cp-tab {
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: calc(var(--radius) - 2px);
          background: transparent;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .cp-tab.active {
          background: rgba(99,102,241,0.18);
          color: var(--accent);
        }

        .cp-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          margin-bottom: 12px;
        }
        .cp-section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          margin: 0 0 14px;
        }

        .cp-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
        .cp-field label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
        .cp-field input, .cp-field select, .cp-field textarea {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-size: 13px;
          padding: 7px 10px;
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .cp-field input:focus, .cp-field select:focus, .cp-field textarea:focus {
          border-color: var(--accent);
        }
        .cp-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .cp-field-wide { grid-column: span 2; }
        .cp-field-inline { flex-direction: row; align-items: center; gap: 10px; }
        .cp-field-inline label { margin: 0; }

        .cp-emoji-input { font-size: 1.4rem; text-align: center; }

        .cp-color-row { display: flex; gap: 8px; align-items: center; }
        .cp-color-picker { width: 44px; height: 36px; padding: 2px; border-radius: 6px; cursor: pointer; }
        .cp-color-text { flex: 1; }

        .cp-zone-checks { display: flex; gap: 10px; flex-wrap: wrap; }
        .cp-zone-check { display: flex; align-items: center; gap: 5px; font-size: 12px; cursor: pointer; }

        .cp-pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .cp-list-row { display: flex; gap: 6px; margin-bottom: 6px; }
        .cp-list-row input { flex: 1; }

        .cp-icon-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 13px;
          padding: 0 6px;
          border-radius: 4px;
          transition: color 0.15s;
        }
        .cp-icon-btn:hover { color: var(--danger); }

        .cp-add-btn {
          background: transparent;
          border: 1px dashed var(--border);
          color: var(--text-muted);
          border-radius: var(--radius-sm);
          padding: 6px 14px;
          font-size: 12px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          margin-top: 4px;
        }
        .cp-add-btn:hover { border-color: var(--accent); color: var(--accent); }

        .cp-service-row {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 12px;
          margin-bottom: 10px;
        }
        .cp-service-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .cp-service-num { font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; }
        .cp-remove-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 12px;
          cursor: pointer;
          transition: color 0.15s;
        }
        .cp-remove-btn:hover { color: var(--danger); }

        .cp-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 8px;
        }
        .cp-save-btn {
          background: var(--accent);
          border: none;
          color: #fff;
          border-radius: var(--radius-sm);
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .cp-save-btn:hover { opacity: 0.85; }
        .cp-cancel-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          border-radius: var(--radius-sm);
          padding: 10px 18px;
          font-size: 13px;
          cursor: pointer;
        }

        /* Gemini tab */
        .cp-gemini { display: flex; flex-direction: column; gap: 14px; }
        .cp-gemini-header { display: flex; gap: 12px; align-items: flex-start; }
        .cp-gemini-icon { font-size: 2rem; line-height: 1; }
        .cp-gemini-header h3 { margin: 0; font-size: 1rem; color: var(--text); }
        .cp-gemini-header p { margin: 4px 0 0; font-size: 12px; color: var(--text-muted); }
        .cp-gemini-warn {
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.3);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          font-size: 12px;
          color: #f59e0b;
        }
        .cp-file-input { cursor: pointer; }
        .cp-file-name { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
        .cp-gemini-textarea {
          resize: vertical;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-size: 12px;
          padding: 10px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          font-family: inherit;
        }
        .cp-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          font-size: 12px;
          color: #ef4444;
        }
        .cp-gemini-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: #fff;
          border-radius: var(--radius-sm);
          padding: 11px 22px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .cp-gemini-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cp-gemini-btn:not(:disabled):hover { opacity: 0.85; }
        .cp-gemini-result {
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.3);
          border-radius: var(--radius-sm);
          padding: 12px;
        }
        .cp-gemini-result-header { font-size: 12px; font-weight: 600; color: #22c55e; margin-bottom: 8px; }
        .cp-json-toggle { font-size: 11px; color: var(--text-muted); cursor: pointer; }
        .cp-json-pre {
          margin: 8px 0 0;
          font-size: 10px;
          color: var(--text-muted);
          overflow: auto;
          max-height: 200px;
          background: var(--surface2);
          border-radius: 4px;
          padding: 8px;
        }

        /* Carrier list */
        .cp-list-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          margin: 0 0 12px;
        }
        .cp-carrier-section { margin-bottom: 16px; }
        .cp-carrier-section-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid var(--border);
        }
        .cp-carrier-card {
          background: var(--surface);
          border: 1px solid;
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          margin-bottom: 8px;
        }
        .cp-cc-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .cp-cc-icon { font-size: 1.1rem; }
        .cp-cc-name { font-size: 13px; font-weight: 700; flex: 1; }
        .cp-cc-builtin { font-size: 10px; color: var(--text-muted); background: var(--surface2); padding: 2px 6px; border-radius: 4px; }
        .cp-cc-actions { display: flex; gap: 4px; }
        .cp-cc-btn {
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 3px 7px;
          font-size: 12px;
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.15s;
        }
        .cp-cc-btn:hover { background: var(--surface2); color: var(--text); }
        .cp-cc-btn.danger:hover { border-color: var(--danger); color: var(--danger); }
        .cp-cc-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); margin-bottom: 6px; }
        .cp-cc-services { display: flex; flex-wrap: wrap; gap: 4px; }
        .cp-cc-svc {
          font-size: 10px;
          background: var(--surface2);
          border-radius: 3px;
          padding: 2px 7px;
          color: var(--text-muted);
        }

        @media (max-width: 900px) and (orientation: landscape) {
          .cp-layout { flex-direction: column; }
          .cp-right { width: 100%; }
          .cp-field-grid { grid-template-columns: 1fr; }
          .cp-field-wide { grid-column: span 1; }
          .cp-pros-cons { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
