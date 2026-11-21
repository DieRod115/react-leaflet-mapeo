import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import ReportsChart from "./ReportsChart";
import { INCIDENTS, incidentColor } from "./reportMeta";

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

const markerDate = (marker) => {
  if (marker.createdAt?.seconds) {
    return new Date(marker.createdAt.seconds * 1000);
  }

  if (marker.reportDate) {
    const parsed = new Date(marker.reportDate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
};

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const monthLabel = (key) => {
  const [year, month] = key.split("-").map(Number);
  return `${MONTHS[month - 1]} ${year}`;
};

const markerInRange = (marker, range) => {
  if (!range.from && !range.to) return true;

  const date = markerDate(marker);
  if (!date) return false;

  const time = date.getTime();
  const from = range.from
    ? new Date(`${range.from}T00:00:00`).getTime()
    : -Infinity;
  const to = range.to
    ? new Date(`${range.to}T23:59:59.999`).getTime()
    : Infinity;

  return time >= from && time <= to;
};

const ReportsPage = ({ onBack }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [incidentFilter, setIncidentFilter] = useState("Todos");
  const [sortOrder, setSortOrder] = useState("recientes");
  const [viewMode, setViewMode] = useState("cards");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

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
      if (!markerInRange(marker, dateRange)) return false;
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
  }, [reports, search, incidentFilter, sortOrder, dateRange]);

  const incidentData = useMemo(() => {
    const counts = Object.fromEntries(
      INCIDENTS.map((incident) => [incident, 0])
    );

    filtered.forEach((marker) => {
      const key = INCIDENTS.includes(marker.incident)
        ? marker.incident
        : "Otro";
      counts[key] += 1;
    });

    return INCIDENTS.map((incident) => ({
      incident,
      count: counts[incident],
    }));
  }, [filtered]);

  const monthData = useMemo(() => {
    const counts = new Map();

    filtered.forEach((marker) => {
      const date = markerDate(marker);
      if (!date) return;

      const key = monthKey(date);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month,
        label: monthLabel(month),
        count,
      }));
  }, [filtered]);

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
          <button
            type="button"
            aria-pressed={viewMode === "chart"}
            style={viewMode === "chart" ? styles.toggleActive : styles.toggle}
            onClick={() =>
              setViewMode((current) =>
                current === "cards" ? "chart" : "cards"
              )
            }
          >
            {viewMode === "cards" ? "Ver gráfico de barras" : "Ver tarjetas"}
          </button>
          <div style={styles.dateFilter}>
            <label style={styles.dateField}>
              <span style={styles.dateLabel}>Desde</span>
              <input
                type="date"
                style={styles.dateInput}
                value={dateRange.from}
                max={dateRange.to || undefined}
                onChange={(e) =>
                  setDateRange((current) => ({
                    ...current,
                    from: e.target.value,
                  }))
                }
              />
            </label>
            <label style={styles.dateField}>
              <span style={styles.dateLabel}>Hasta</span>
              <input
                type="date"
                style={styles.dateInput}
                value={dateRange.to}
                min={dateRange.from || undefined}
                onChange={(e) =>
                  setDateRange((current) => ({
                    ...current,
                    to: e.target.value,
                  }))
                }
              />
            </label>
            {(dateRange.from || dateRange.to) && (
              <button
                type="button"
                style={styles.clearDates}
                onClick={() => setDateRange({ from: "", to: "" })}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p style={styles.empty}>Cargando reportes...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.empty}>
            {reports.length === 0
              ? "Aún no hay reportes aprobados en el mapa."
              : "No hay reportes que coincidan con el filtro."}
          </p>
        ) : viewMode === "chart" ? (
          <ReportsChart incidentData={incidentData} monthData={monthData} />
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
    backgroundColor: "#121212",
    color: "#e5e7eb",
    colorScheme: "dark",
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
    borderBottom: "1px solid #2a2a2a",
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  backBtn: {
    padding: "6px 12px",
    backgroundColor: "#1f1f1f",
    border: "1px solid #3f3f3f",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#e5e7eb",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    color: "#f9fafb",
    flex: 1,
  },
  count: { fontSize: "13px", color: "#9ca3af" },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px 16px 40px",
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #2f2f2f",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "18px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
  },
  searchInput: {
    flex: "1 1 240px",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #3f3f3f",
    fontSize: "13px",
    color: "#e5e7eb",
    backgroundColor: "#232323",
  },
  select: {
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #3f3f3f",
    fontSize: "13px",
    backgroundColor: "#232323",
    color: "#e5e7eb",
    cursor: "pointer",
  },
  toggle: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #3f3f3f",
    fontSize: "13px",
    fontWeight: "bold",
    backgroundColor: "#232323",
    color: "#e5e7eb",
    cursor: "pointer",
  },
  toggleActive: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    fontSize: "13px",
    fontWeight: "bold",
    backgroundColor: "#e5e7eb",
    color: "#111827",
    cursor: "pointer",
  },
  dateFilter: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    padding: "4px 8px",
    border: "1px solid #2f2f2f",
    borderRadius: "8px",
    backgroundColor: "#1f1f1f",
  },
  dateField: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  dateLabel: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#9ca3af",
  },
  dateInput: {
    padding: "6px 8px",
    borderRadius: "6px",
    border: "1px solid #3f3f3f",
    fontSize: "13px",
    color: "#e5e7eb",
    backgroundColor: "#232323",
    colorScheme: "dark",
  },
  clearDates: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #4b1f1f",
    fontSize: "12px",
    backgroundColor: "#2a1a1a",
    color: "#fca5a5",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "14px",
  },
  card: {
    backgroundColor: "#1e1e1e",
    border: "1px solid rgba(255, 255, 255, 0.22)",
    borderRadius: "1px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "8px",
  },
  cardTitle: { margin: 0, fontSize: "15px", color: "#f3f4f6" },
  statusBadge: {
    padding: "2px 8px",
    borderRadius: "999px",
    backgroundColor: "#14532d",
    color: "#bbf7d0",
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
  description: { margin: 0, fontSize: "13px", color: "#d1d5db" },
  metaList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    borderTop: "1px solid #2f2f2f",
    paddingTop: "8px",
  },
  meta: { margin: 0, fontSize: "12px", color: "#9ca3af" },
  empty: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "14px",
    padding: "40px 16px",
  },
};

export default ReportsPage;
