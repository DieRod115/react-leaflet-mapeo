
import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const AdminPanel = ({ onClose }) => {
  const [pending, setPending] = useState([]);
  const [rejectNotes, setRejectNotes] = useState({});
  // Edición 
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editIncident, setEditIncident] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // ─── Escuchar en tiempo real solo los marcadores pendientes ──────────────
  useEffect(() => {
    const q = query(
      collection(db, "markers"),
      where("status", "==", "pendiente")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPending(data);
    });

    return () => unsubscribe();
  }, []);
  

  // ─── Edición de pendientes ─────────────────────────────────────────────────────────────────────
  const startEdit = (marker) => {
    setEditingId(marker.id);
    setEditLabel(marker.label);
    setEditIncident(marker.incident || "");
    setEditDesc(marker.description || "");
  };
 
  const handleSaveEdit = async (id) => {
    await updateDoc(doc(db, "markers", id), {
      label: editLabel,
      incident: editIncident,
      description: editDesc,
    });
    setEditingId(null);
  };
//────────────────────────────────────────────────────────────────────────────────────────────────

  // ─── APROBAR: cambia status a "aprobado" ─────────────────────────────────
  const handleApprove = async (id) => {
    const marker = pending.find((m) => m.id === id);
    await updateDoc(doc(db, "markers", id), {
      status: "aprobado",
      adminNote: "",
    });
    if (marker) {
      await addDoc(collection(db, "notifications"), {
        userId: marker.createdBy,
        type: "aprobado",
        title: "Reporte aprobado",
        message: `Tu reporte "${marker.label}" ha sido aprobado.`,
        adminNote: "",
        read: false,
        createdAt: serverTimestamp(),
      });
    }
    if (editingId === id) setEditingId(null); 
  };

  // ─── RECHAZAR: cambia status a "rechazado" y guarda el motivo ────────────
    const handleReject = async (id) => {
    const note = rejectNotes[id] || "";
 
    // Confirmación opcional antes de eliminar
    if (!window.confirm(`¿Rechazar y eliminar este reporte?${note ? `\n\nMotivo: ${note}` : ""}`)) return;
   const marker = pending.find((m) => m.id === id);

 
  if (marker) {
    await addDoc(collection(db, "notifications"), {
      userId: marker.createdBy,
      type: "rechazado",
      title: "Reporte rechazado",
      message: `Tu reporte "${marker.label}" fue rechazado por un moderador.`,
      adminNote: note,
      read: false,
      createdAt: serverTimestamp(),
    });
  }
    await deleteDoc(doc(db, "markers", id));

    // Limpiar el campo de ese reporte
    setRejectNotes((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };


  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        {/* Encabezado */}
        <div style={styles.header}>
          <h3 style={styles.title}> Panel de Reportes</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
      {/*
        <p style={styles.subtitle}>
          {pending.length === 0
            ? "No hay reportes pendientes."
            : `${pending.length} reporte${pending.length > 1 ? "s" : ""} pendiente${pending.length > 1 ? "s" : ""} de revisión`}
        </p>*/} 
      
        {/* Edición */}
        <div style={styles.list}>
          {pending.map((marker) => (
  <div key={marker.id} style={styles.card}>
    {editingId === marker.id ? (
      <>
        <input
          style={styles.input}
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          placeholder="Nombre"
        />
        <select style={styles.input} value={editIncident} onChange={(e) => setEditIncident(e.target.value)}>
          <option value="">Seleccionar incidente</option>
          <option value="Robo">Robo</option>
          <option value="Asalto">Asalto</option>
          <option value="Acoso">Acoso</option>
          <option value="Violencia">Violencia</option>
        </select>
        <textarea style={styles.noteInput} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Descripción" rows={3} />
        <div style={styles.actionRow}>
          <button style={{ ...styles.btn, backgroundColor: "#3b82f6" }} onClick={() => handleSaveEdit(marker.id)}>Guardar</button>
          <button style={{ ...styles.btn, backgroundColor: "#6b7280" }} onClick={() => setEditingId(null)}>Cancelar</button>
        </div>
      </>
    ) : (
      <>
      {/* Lista de reportes pendientes */}
        <p style={styles.markerLabel}>{marker.label}</p>
        {marker.description && <p style={styles.markerDesc}>{marker.description}</p>}
        <div style={styles.metaRow}>Incidente: {marker.incident || "No especificado"}</div>
        <div style={styles.metaRow}>Usuario: {marker.createdByName || "Desconocido"}</div>
        <div style={styles.metaRow}>Ubicación: {marker.lat?.toFixed(5)}, {marker.lng?.toFixed(5)}</div>
        {marker.createdAt?.seconds && (
          <div style={styles.metaRow}>Fecha: {new Date(marker.createdAt.seconds * 1000).toLocaleString("es-EC")}</div>
        )}
        <textarea
          style={styles.noteInput}
          placeholder="Motivo de rechazo"
          value={rejectNotes[marker.id] || ""}
          onChange={(e) => setRejectNotes((prev) => ({ ...prev, [marker.id]: e.target.value }))}
          rows={2}
        />
        <div style={styles.actionRow}>
          <button style={{ ...styles.btn, backgroundColor: "#3b82f6" }} onClick={() => startEdit(marker)}>Editar</button>
          <button style={{ ...styles.btn, backgroundColor: "#10b981" }} onClick={() => handleApprove(marker.id)}>Aprobar</button>
          <button style={{ ...styles.btn, backgroundColor: "#ef4444" }} onClick={() => handleReject(marker.id)}>Rechazar</button>
        </div>
      </>
    )}
  </div>
))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000, 
    display: "flex",
    justifyContent: "flex-end",
    pointerEvents: "none", 
  },
  panel: {
    width: "320px",
    height: "100%",
    backgroundColor: "#fff",
    boxShadow: "-4px 0 16px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    pointerEvents: "all", 
    overflowY: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#1e3a5f",
  },
  title: { margin: 0, fontSize: "16px", color: "#fff" },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
  },
  subtitle: {
    padding: "10px 16px 4px",
    fontSize: "13px",
    color: "#6b7280",
    margin: 0,
  },
  list: {
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  card: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  markerLabel: {
    fontWeight: "bold",
    fontSize: "14px",
    margin: 0,
    color: "#111",
  },
  markerDesc: { fontSize: "13px", color: "#444", margin: 0 },
  metaRow: { fontSize: "12px", color: "#6b7280" },
  noteInput: {
    padding: "6px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "12px",
    width: "100%",
    resize: "none",
    marginTop: "4px",
  },
  actionRow: { display: "flex", gap: "8px", marginTop: "4px" },
  btn: {
    flex: 1,
    padding: "7px",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },
};

export default AdminPanel;