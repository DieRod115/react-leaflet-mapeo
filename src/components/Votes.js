import React, { useState, useEffect } from "react";
import {
  collection, addDoc, onSnapshot,
  deleteDoc, doc, serverTimestamp, query, where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

export default function Votes({ markerId }) {
  const [votes, setVotes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  // Escuchar en tiempo real los votos del marcador
  useEffect(() => {
    const q = query(
      collection(db, "votes"),
      where("markerId", "==", markerId)
    );
    const unsub = onSnapshot(q, (snap) => {
      setVotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [markerId]);

  // Voto del usuario actual y contadores derivados del snapshot
  const myVote = user ? votes.find((v) => v.userId === user.uid) : null;
  const activeBtn = myVote?.type ?? "none"; // "like" | "dislike" | "none"
  const likeCount = votes.filter((v) => v.type === "like").length;
  const dislikeCount = votes.filter((v) => v.type === "dislike").length;

  const handleReactionClick = async (reaction) => {
    if (!user) {
      alert("Debes iniciar sesión para votar.");
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Si ya votó, se elimina su voto anterior (permite cambiarlo o quitarlo)
      if (myVote) {
        await deleteDoc(doc(db, "votes", myVote.id));
      }
      // Si no había votado o cambió de opción, se registra el nuevo voto
      if (!myVote || myVote.type !== reaction) {
        await addDoc(collection(db, "votes"), {
          markerId,
          userId: user.uid,
          type: reaction,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error al registrar el voto:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.container} onClick={(e) => e.stopPropagation()}>
      <div className="btn-container">
        {/* Botón para votar positivo */}
        <button
          className={`btn ${activeBtn === "like" ? "like-active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleReactionClick("like");
          }}
          disabled={isSaving}
        >
          <span className="material-symbols-rounded">thumb_up</span>
          Like {likeCount}
        </button>

        {/* Botón para votar negativo */}
        <button
          className={`btn ${activeBtn === "dislike" ? "dislike-active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleReactionClick("dislike");
          }}
          disabled={isSaving}
        >
          <span className="material-symbols-rounded">thumb_down</span>
          Dislike {dislikeCount}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { marginTop: "8px" },
};
