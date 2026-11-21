import { useState, useEffect, useRef } from "react";
import Marker from "../assets/icon.png";
import UserIcon from "../assets/uicon.png";
import MarkerIcon from "../assets/micon.png";
import IconLocation from "./IconLocation";
import TemporaryIcon from "../assets/ticon.png";

const TOOLS = [
  { id: "reportepropio", label: "Reporte propio", icon: <img src={MarkerIcon} alt="Marker Icon" /> },
  { id: "reporte", label: "Reporte de otro usuario", icon: <img src={Marker} alt="Report Icon" /> },
  { id: "espera", label: "En espera de moderación", icon: <img src={TemporaryIcon} alt="Waiting Icon" />},
  { id: "seguimiento", label: "Seguimiento en tiempo real", icon: <img src={UserIcon} alt="Tracking Icon" /> },
  
];

export default function SmartSidebar({ 
  tools = TOOLS, 
  side = "right", 
  handleTop = 20 
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Cerrar con clic fuera del panel o con Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <style>{css}</style>

      {/* Único elemento interactivo: la pestaña que abre el panel */}
      {!open && (
        <button className={`ss-handle is-${side}`} style={{ top: `${handleTop}%` }} aria-label="Abrir barra lateral" onClick={() => setOpen(true)} />
      )}

      <aside
        ref={panelRef}
        className={`ss-panel is-${side} ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        aria-label="Barra lateral"
      >
        <div className="ss-grip" />

        {/* Lista estática: sin botones, sin clics, sin foco */}
        <ul className="ss-grid">
          {tools.map((tool) => (
            <li key={tool.id} className="ss-item">
              <span className="ss-icon" style={{ background: tool.color }} aria-hidden="true">
                {tool.icon}
              </span>
              <span className="ss-label">{tool.label}</span>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}

const css = `
.ss-handle {
  position: fixed; z-index: 900;
  width: 10px; height: 72px; border: 0; padding: 0; cursor: pointer;
  border-radius: 8px 0 0 8px; background: rgba(29, 8, 8, 0.45);
}
.ss-handle:hover { width: 12px; background: rgba(255,255,255,.7); }
.ss-handle:focus-visible { outline: 2px solid #6cb2ff; outline-offset: 2px; }

.ss-panel {
  position: fixed; top: 12%; right: 0; z-index: 1000;
  width: 180px; max-height: 76vh; overflow-y: auto;
  padding: 10px 16px 20px; box-sizing: border-box;
  background: #2b2b2e; color: #f1f1f1;
  border-radius: 28px 0 0 28px;
  box-shadow: -8px 8px 32px rgba(0,0,0,.45);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
 
  transition: transform .28s cubic-bezier(.2,.8,.2,1);
}
.ss-panel.is-open { transform: translateX(0); }



.ss-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px 8px;
  list-style: none; margin: 0; padding: 0;
}
.ss-handle.is-right { right: 0; border-radius: 8px 0 0 8px; }
.ss-handle.is-left  { left: 0;  border-radius: 0 8px 8px 0; }

.ss-panel.is-right { right: 0; border-radius: 28px 0 0 28px; transform: translateX(105%); }
.ss-panel.is-left  { left: 0;  border-radius: 0 28px 28px 0; transform: translateX(-105%); }
.ss-panel.is-open  { transform: translateX(0); }
/* Elementos solo de lectura: no responden a nada */
.ss-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 2px;
  cursor: default;
  pointer-events: none;   /* ignora clic, hover y toque */
  user-select: none;      /* no se puede seleccionar el texto */
}
.ss-icon {
  width: 56px; height: 56px; border-radius: 50%;
  display: grid; place-items: center; font-size: 20px;
}
.ss-label { font-size: 11px; line-height: 1.2; text-align: center; color: #d6d6da; }
.ss-icon svg,
.ss-icon img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}
@media (prefers-reduced-motion: reduce) {
  .ss-panel { transition: none; }
}
`;