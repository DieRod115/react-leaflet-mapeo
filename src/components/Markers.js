
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  or,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import IconLocation from "./IconLocation";
import TemporaryIcon from "./TemporaryIcon";
import Comments from "./Comments";
import UserIcon from "./UserIcon";
import MarkerIcon from "./MarkerIcon";
import handleSaveEdit from "./adminpanel";
import handleDelete from "./adminpanel";

const Markers = forwardRef((props, ref) => {
  const { user, role } = useAuth();
  const map = useMap();
  const [markers, setMarkers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editCrime, setEditCrime] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [pendingPosition, setPendingPosition] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [FollowUserMarker, setFollowUserMarker] = useState(null);
  const [newCrime, setNewCrime] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const pendingMarkerRef = React.useRef(null);
  const watchIdRef = useRef(null);

  // Mostrar marcadores
  useEffect(() => {
     const approvedQuery = query(
      collection(db, "markers"),
      where("status", "==", "aprobado")
    );
 
    const myPendingQuery = query(
      collection(db, "markers"),
      where("status", "==", "pendiente"),
      where("createdBy", "==", user.uid)
    );
 
    let approved = [];
    let myPending = [];
 
    const mergeAndSet = () => {
      // Evita duplicados 
      const ids = new Set();
      const combined = [];
      [...approved, ...myPending].forEach((m) => {
        if (!ids.has(m.id)) { ids.add(m.id); combined.push(m); }
      });
      setMarkers(combined);
    };
 
    const unsubApproved = onSnapshot(approvedQuery, (snap) => {
      approved = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      mergeAndSet();
    });
 
    const unsubMyPending = onSnapshot(myPendingQuery, (snap) => {
      myPending = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      mergeAndSet();
    });
 
    return () => { unsubApproved(); unsubMyPending(); };
  }, [user.uid]);


  // Abrir popup del marcador pendiente al hacer clic en el mapa
  useEffect(() => {
    if (pendingPosition && pendingMarkerRef.current) {
      pendingMarkerRef.current.openPopup();
    }
  }, [pendingPosition]);

  //  clic en el mapa agrega un marcador/ 
  useMapEvents({
    click: async(e) => {
      if (pendingPosition) return;
      setPendingPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      setNewLabel("");
      setNewCrime("");
      setNewDesc("");
    }     
  });

//marcador en posicion actual
const handleUseCurrentLocation = () => {
    if (pendingPosition) return; 
 
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
 
        map.setView([latitude, longitude], 17);
 
        setPendingPosition({ lat: latitude, lng: longitude });
        setNewLabel("");
        setNewCrime("");
        setNewDesc("");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert("Permiso de ubicación denegado. Actívalo en la configuración del navegador.");
        } else {
          alert("No se pudo obtener tu ubicación. Intenta de nuevo.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0,}
    );
  };
 //seguimiento en tiempo real del usuario
const handleFollowUser = () => {
    if (isFollowing) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsFollowing(false);
      setFollowUserMarker(null);
    } else {
      if (!navigator.geolocation) {
        alert("Geolocalización no soportada por tu navegador.");
        return;
    }
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFollowUserMarker([latitude, longitude]);
          map.setView([latitude, longitude], 17);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            alert("Permiso de ubicación denegado. Actívalo en la configuración del navegador.");
          } else {
            alert("No se pudo obtener tu ubicación. Intenta de nuevo.");
          }
          setIsFollowing(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0,}
    );
    watchIdRef.current = watchId;
    setIsFollowing(true);
  };
};
  useImperativeHandle(ref, () => ({
    useCurrentLocation: handleUseCurrentLocation,
    FollowUser: handleFollowUser,
  }));

// Limpiar el watch de geolocalización al desmontar el componente
useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

//  guardar nuevo marcador 
  const handleConfirmNewMarker = async () => {
    if (!newLabel.trim()) return; 
    await addDoc(collection(db, "markers"), {
      lat: pendingPosition.lat,
      lng: pendingPosition.lng,
      fecha: new Date().toISOString(),
      reportDate: new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      label: newLabel,
      incident: newCrime,
      description: newDesc,
      createdBy: user.uid,
      createdByName: user.displayName || user.email,
      createdAt: serverTimestamp(),
      status: "pendiente",
    });
    setPendingPosition(null);
  };

  const handleCancelNewMarker = () => {
    setPendingPosition(null);
  };


  //  guardar cambios  
  const handleSaveEdit = async (id) => {
    const marker = markers.find((m) => m.id === id);
    await updateDoc(doc(db, "markers", id), {
      label: editLabel,
      description: editDesc,
      incident: editCrime,
    });
     if (marker) {
        await addDoc(collection(db, "notifications"), {
          userId: marker.createdBy,
          type: "editado",
          title: "Reporte editado",
          message: `Tu reporte "${marker.label}" fue editado por un moderador.`,
          adminNote: "",
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    setEditingId(null);
  };

  //  borrar marcador 
  const handleDelete = async (id) => {
    const marker = markers.find((m) => m.id === id);
    if (window.confirm("¿Eliminar este marcador?")) {
      if (marker) {
          await addDoc(collection(db, "notifications"), {
            userId: marker.createdBy,
            type: "eliminado",
            title: "Reporte eliminado",
            message: `Tu reporte "${marker.label}" fue eliminado por un moderador.`,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      await deleteDoc(doc(db, "markers", id));
    }
  };

  // edita marcador
  const startEdit = (marker) => {
    setEditingId(marker.id);
    setEditLabel(marker.label);
    setEditDesc(marker.description || "");
    setEditCrime(marker.incident || "");
  };
  
return (
  // creacion de marcadores
    <>
      {pendingPosition && (
        <Marker
          ref={pendingMarkerRef}
          position={[pendingPosition.lat, pendingPosition.lng]}
          icon={TemporaryIcon}
        >
          <Popup minWidth={220} closeOnClick={false} closeButton={false}>
            <div style={styles.popupContent}>
              <p style={styles.label}>Nuevo marcador</p>
              <input
                style={styles.input}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Nombre del marcador"
                autoFocus
              />
              <select
                style={styles.input}
                value={newCrime}
                onChange={(e) => setNewCrime(e.target.value)}
              >
                <option value="">Seleccionar incidente</option>
                <option value="Robo">Robo</option>
                <option value="Asalto">Asalto</option>
                <option value="Acoso">Acoso</option>
                <option value="Violencia">Violencia</option>
                <option value="Otro">Otro</option>
              </select>
              <textarea
                style={styles.textarea}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Descripción"
                rows={3}
              />
              <p style={styles.hint}>Tu marcador será revisado por un moderador antes de ser aprobado.</p>
              <div style={styles.buttonRow}>
                <button
                  style={{ ...styles.btn, backgroundColor: "#10b981" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmNewMarker();
                  }}
                  disabled={!newLabel.trim()}>Confirmar</button>
                <button
                  style={{ ...styles.btn, backgroundColor: "#6b7280" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelNewMarker();
                  }} >Cancelar</button>
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={marker.status === "aprobado" ? marker.createdBy === user.uid ? MarkerIcon :  IconLocation : TemporaryIcon}
          
        >
          <Popup 
          key={marker.id}
          minWidth={340}
          maxWidth={420}
          maxHeight={600}
          >

            {editingId === marker.id ? (
              // edicion del marcador------------------------------------------------------------------------------------
              <div style={styles.popupContent}>
                <input
                  style={styles.input}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Nombre del marcador"
                />
                <select
                  style={styles.input}
                  value={editCrime}
                  onChange={(e) => setEditCrime(e.target.value)}
                >
                  <option value="">Seleccionar incidente</option>
                  <option value="Robo">Robo</option>
                  <option value="Asalto">Asalto</option>
                  <option value="Acoso">Acoso</option>
                  <option value="Violencia">Violencia</option>
                  <option value="Otro">Otro</option>
                </select>
                <textarea
                  style={styles.textarea}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Descripción"
                  rows={3}
                />
                <div style={styles.buttonRow}>
                  <button
                    style={{ ...styles.btn, backgroundColor: "#10b981" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEdit(marker.id);
                    }}
                  >
                    Guardar
                  </button>
                  <button
                    style={{ ...styles.btn, backgroundColor: "#6b7280" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // vista del marcador----------------------------------------------------------------------------
              <div style={styles.popupContent}>
                <p style={styles.label}>{marker.label}</p>
                <p style={styles.meta}>Fecha de reporte: {marker.reportDate || "No especificada"}</p>
                <p style={styles.meta}>Incidente: {marker.incident || "No especificado"}</p>
                {marker.description && (
                  <p style={styles.description}>{marker.description}</p>
                )}
                {/* Botón para ver/ocultar comentarios */}
                <button
                  style={{ ...styles.btn, backgroundColor: "#7d853a" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(expandedId === marker.id ? null : marker.id);
                  }}
                >
                  {expandedId === marker.id ? "Ocultar comentarios" : "Ver comentarios"}
                </button>
                
                {/*vista extendida del marcador*/}
                {expandedId === marker.id && (
                  <div>
                    <p style={styles.meta}>Comentarios</p>
                    <Comments markerId={marker.id} />
                  </div>
                )}
                {/*Mostrar botones de edicion y eliminacion solo al administrador */}
                {role === "admin" && (
                  <div style={styles.buttonRow}>
                    <button
                      style={{ ...styles.btn, backgroundColor: "#3b82f6" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(marker);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      style={{ ...styles.btn, backgroundColor: "#ef4444" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(marker.id);
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}

          </Popup>
          
        </Marker>
      ))}
      {/* Renderizar el marcador de seguimiento del usuario si está activo */}
      {FollowUserMarker && (
        <Marker
          position={FollowUserMarker}
          icon={UserIcon}
        />
        
      )}
    </>
  );
});
{/*IMPORTANTE: e.stopPropagation() evita que el popup se cierre al hacer clic en los botones dentro de él, recuérdalo */}

const styles = {
  popupContent: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontWeight: "bold", fontSize: "14px", margin: 0 },
  description: { fontSize: "13px", color: "#444", margin: 0 },
  meta: { fontSize: "12px", color: "#888", margin: 0 },
  input: {
    padding: "6px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "13px",
    width: "100%",
  },
  textarea: {
    padding: "6px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "13px",
    width: "100%",
    resize: "vertical",
  },
  buttonRow: { display: "flex", gap: "6px", marginTop: "4px" },
  btn: {
    flex: 1,
    padding: "6px",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
};

export default Markers;
