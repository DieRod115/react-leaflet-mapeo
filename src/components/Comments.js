import React, { useState, useEffect, useRef } from "react";
import {
  collection, addDoc, onSnapshot,
  deleteDoc, doc, serverTimestamp, query, where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import icon2 from "../assets/SendIcon.png";

export default function Comments({ markerId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [feedback, setFeedback] = useState(null); // { type: "ok" | "error", text }
  const [sending, setSending] = useState(false);
  const feedbackTimer = useRef(null);
  const { user, role } = useAuth();

  // Limpiar el temporizador del mensaje al desmontar
  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

  // Mostrar mensaje temporal de confirmación/error
  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2500);
  };
  
//Función para escuchar los comentarios de un marcador
  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("markerId", "==", markerId)
    );
    // Escuchar en tiempo real los comentarios del marcador
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    //
    return () => unsub();
  }, [markerId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, "comments"), {
        markerId,
        userId: user.uid,
        userName: user.displayName || user.email,
        text: newComment,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
      showFeedback("ok", "Comentario enviado");
    } catch (error) {
      console.error("Error al agregar comentario:", error);
      showFeedback("error", "No se pudo enviar el comentario. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
     if (window.confirm("¿Eliminar este comentario?")) {
      await deleteDoc(doc(db, "comments", commentId));
    } 
  };

  const formatDate = (ts) => {
    if (!ts?.seconds) return "";
    return new Date(ts.seconds * 1000).toLocaleString("es-EC", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div style={styles.container} onClick={(e) => e.stopPropagation()}>
      {/* Lista de comentarios */}
      {comments.length === 0 ? (
        <p style={styles.empty}>Sin comentarios aún.</p>
      ) : (
        <div style={styles.list}>
          {comments.map((comment) => (
            <div key={comment.id} style={styles.commentCard}>
              <div style={styles.commentHeader}>
                <span style={styles.userName}>{comment.userName}</span>
                <span style={styles.date}>{formatDate(comment.createdAt)}</span>
              </div>
              <p style={styles.commentText}>{comment.text}</p>
              {(role === "admin" || user?.uid === comment.userId) && (
                <button
                  style={styles.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); handleDeleteComment(comment.id); }}
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Agregar comentario */}
      <div style={styles.inputArea}>
        <textarea
          style={styles.textarea}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escribe un comentario..."
          rows={2}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          style={{ ...styles.addBtn, opacity: !newComment.trim() || sending ? 0.5 : 1 }}
          onClick={(e) => { e.stopPropagation(); handleAddComment(); }}
          disabled={!newComment.trim() || sending}
          title={sending ? "Enviando..." : "Enviar comentario"}
        >
          <img src={icon2} alt="Send Icon" style={{ width: "23px", height: "23px" }} />

        </button>
      </div>

      {/* Mensaje de confirmación al enviar (espacio reservado para que el popup no salte) */}
      <p
        role="status"
        aria-live="polite"
        style={{
          ...styles.feedback,
          color: feedback?.type === "ok" ? "#10b981" : "#f87171",
        }}
      >
        {feedback?.text || ""}
      </p>
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" },
  empty: { fontSize: "11px", color: "#9ca3af", fontStyle: "italic", margin: 0 },
  feedback: {
    fontSize: "11px", margin: 0, minHeight: "14px",
    transition: "color 0.15s ease",
  },
  list: { display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" },
  commentCard: {
    backgroundColor: "#2a2a2a", borderRadius: "6px",
    padding: "6px 8px", display: "flex", flexDirection: "column", gap: "2px",
  },
  commentHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  userName: { fontWeight: "bold", fontSize: "11px", color: "#e5e7eb" },
  date: { fontSize: "10px", color: "#9ca3af" },
  commentText: { fontSize: "12px", wordBreak: "break-word", whiteSpace: "pre-wrap", color: "#d1d5db", margin: 0 },
  deleteBtn: {
    alignSelf: "flex-end", background: "none", border: "none",
    color: "#f87171", fontSize: "10px", cursor: "pointer", padding: 0,
  },
  inputArea: { display: "flex", flexDirection: "column", gap: "4px" },
  textarea: {
    padding: "6px", borderRadius: "6px", border: "1px solid #3f3f3f",
    backgroundColor: "#2a2a2a", color: "#f5f5f5",
    fontSize: "12px", resize: "none", width: "81%",
  },
  
  addBtn: {
    padding: "6px", backgroundColor: "rgba(24, 24, 24, 0.95)", color: "#fff",
    border: "1px solid #3f3f3f", borderRadius: "50%", cursor: "pointer", fontSize: "10px", 
    position: "absolute", alignSelf: "flex-end", height: "44px", width: "44px", 
    display: "flex", alignItems: "center", justifyContent: "center",
    aspectRatio: "1 / 1", // Mantener proporción cuadrada
  },
};