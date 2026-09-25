// src/components/NotifPanel.js
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  getDocs,
  doc,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

const PanelNotif = ({ onClose }) => {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);

  // Escuchar notificaciones en tiempo real
  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user.uid]);

  // Al abrir el panel, marcar todas como leídas
  useEffect(() => {
    const markAllRead = async () => {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("read", "==", false)
      );
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await updateDoc(doc(db, "notifications", d.id), { read: true });
      });
    };
    markAllRead();
  }, []); // eslint-disable-line

  const getIcon = (type) => {
    if (type === "aprobado") return "";
    if (type === "rechazado") return "";
    if (type === "nearby") return "";
    return "🔔";
  };

  const getBorderColor = (type) => {
    if (type === "aprobado") return "#10b981";
    if (type === "rechazado") return "#ef4444";
    if (type === "nearby") return "#3b82f6";
    return "#d1d5db";
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return "";
    return new Date(timestamp.seconds * 1000).toLocaleString("es-EC", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>Notificaciones</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p style={styles.subtitle}>
          {notifs.length === 0 ? "No tienes notificaciones." : `${notifs.length} notificación${notifs.length > 1 ? "es" : ""}`}
        </p>
        <div style={styles.list}>
          {notifs.map((notif) => (
            <div key={notif.id} style={{ ...styles.card, borderLeft: `4px solid ${getBorderColor(notif.type)}` }}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>{getIcon(notif.type)}</span>
                <span style={styles.cardTitle}>{notif.title}</span>
              </div>
              <p style={styles.cardMessage}>{notif.message}</p>
              {notif.adminNote && (
                <p style={styles.adminNote}>{notif.adminNote}</p>
              )}
              <p style={styles.cardDate}>{formatDate(notif.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 2000, display: "flex", justifyContent: "flex-end", pointerEvents: "none" },
  panel: { width: "320px", height: "100%", backgroundColor: "#fff", boxShadow: "-4px 0 16px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", pointerEvents: "all", overflowY: "auto" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#1e3a5f" },
  title: { margin: 0, fontSize: "16px", color: "#fff" },
  closeBtn: { background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer" },
  subtitle: { padding: "10px 16px 4px", fontSize: "13px", color: "#6b7280", margin: 0 },
  list: { padding: "8px 12px", display: "flex", flexDirection: "column", gap: "10px" },
  card: { backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px" },
  cardHeader: { display: "flex", alignItems: "center", gap: "6px" },
  cardIcon: { fontSize: "16px" },
  cardTitle: { fontWeight: "bold", fontSize: "13px", color: "#111" },
  cardMessage: { fontSize: "13px", color: "#374151", margin: 0 },
  adminNote: { fontSize: "12px", color: "#6b7280", fontStyle: "italic", margin: 0, backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: "4px" },
  cardDate: { fontSize: "11px", color: "#9ca3af", margin: 0 },
};

export default PanelNotif;