import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

const INCIDENTS = ["Robo", "Asalto", "Acoso", "Violencia", "Otro"];

const incidentColor = (incident) => {
  if (incident === "Robo") return "#ef4444";
  if (incident === "Asalto") return "#f59e0b";
  if (incident === "Acoso") return "#8b5cf6";
  if (incident === "Violencia") return "#dc2626";
  if (incident === "Otro") return "#3b82f6";
  return "#6b7280";
};

const formatDate = (marker) => {
  if (marker.createdAt?.seconds) {
    return new Date(marker.createdAt.seconds * 1000).toLocaleString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return marker.reportDate || "Fecha no especificada";
};

const ReportsPage = ({ onBack }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [incidentFilter, setIncidentFilter] = useState("Todos");
  const [sortOrder, setSortOrder] = useState("recientes");

  // Escuchar en tiempo real todos los reportes aprobados (los que están en el mapa)
  useEffect(() => {
    const q = query(
      collection(db, "markers"),
      where("status", "==", "aprobado")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReports(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = reports.filter((marker) => {
      const matchesIncident =
        incidentFilter === "Todos" ||
        (marker.incident || "Otro") === incidentFilter;

      if (!matchesIncident) return false;
      if (!term) return true;

      return [marker.label, marker.description, marker.incident, marker.createdByName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });

    return result.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return sortOrder === "recientes" ? bTime - aTime : aTime - bTime;
    });
  }, [reports, search, incidentFilter, sortOrder]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          ← Volver al mapa
        </button>
        <h1 style={styles.title}>Reportes</h1>
        <span style={styles.count}>
          {loading
            ? "Cargando..."
            : `${filtered.length} reporte${filtered.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div style={styles.content}>
        <div style={styles.toolbar}>
          <input
            style={styles.searchInput}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, descripción o usuario..."
          />
          <select
            style={styles.select}
            value={incidentFilter}
            onChange={(e) => setIncidentFilter(e.target.value)}
          >
            <option value="Todos">Todos los incidentes</option>
            {INCIDENTS.map((incident) => (
              <option key={incident} value={incident}>
                {incident}
              </option>
            ))}
          </select>
          <select
            style={styles.select}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
          </select>
        </div>

        {loading ? (
          <p style={styles.empty}>Cargando reportes...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.empty}>
            {reports.length === 0
              ? "Aún no hay reportes aprobados en el mapa."
              : "No hay reportes que coincidan con el filtro."}
          </p>
        ) : (
          <div style={styles.grid}>
            {filtered.map((marker) => (
              <div
                key={marker.id}
                style={{
                  ...styles.card,
                  borderTop: `4px solid ${incidentColor(marker.incident)}`,
                }}
              >
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>{marker.label || "Sin nombre"}</h2>
                  <span style={styles.statusBadge}>Aprobado</span>
                </div>

                <span
                  style={{
                    ...styles.incidentBadge,
                    backgroundColor: incidentColor(marker.incident),
                  }}
                >
                  {marker.incident || "No especificado"}
                </span>

                {marker.description && (
                  <p style={styles.description}>{marker.description}</p>
                )}

                <div style={styles.metaList}>
                  <p style={styles.meta}>Fecha: {formatDate(marker)}</p>
                  <p style={styles.meta}>
                    Ubicación: {marker.lat?.toFixed(5)}, {marker.lng?.toFixed(5)}
                  </p>
                  <p style={styles.meta}>
                    Reportado por: {marker.createdByName || "Desconocido"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3000,
    backgroundColor: "#f3f4f6",
    overflowY: "auto",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px 16px",
    backgroundColor: "rgba(24, 24, 24, 0.97)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  backBtn: {
    padding: "6px 12px",
    backgroundColor: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#fff",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    color: "#fff",
    flex: 1,
  },
  count: { fontSize: "13px", color: "#ccc" },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px 16px 40px",
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "18px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  searchInput: {
    flex: "1 1 240px",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "13px",
    color: "#111",
  },
  select: {
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "13px",
    backgroundColor: "#fff",
    color: "#111",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "14px",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "1px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "8px",
  },
  cardTitle: { margin: 0, fontSize: "15px", color: "#111" },
  statusBadge: {
    padding: "2px 8px",
    borderRadius: "999px",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    fontSize: "11px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  incidentBadge: {
    alignSelf: "flex-start",
    padding: "2px 10px",
    borderRadius: "999px",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "bold",
  },
  description: { margin: 0, fontSize: "13px", color: "#374151" },
  metaList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    borderTop: "1px solid #f3f4f6",
    paddingTop: "8px",
  },
  meta: { margin: 0, fontSize: "12px", color: "#6b7280" },
  empty: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px",
    padding: "40px 16px",
  },
};

export default ReportsPage;
