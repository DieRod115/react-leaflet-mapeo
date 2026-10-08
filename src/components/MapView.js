
import React from "react";
import HeatmapLayer from "./HeatmapLayer";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import { signOut } from "firebase/auth";
import "leaflet/dist/leaflet.css";
import Markers from "./Markers";
import PanelNotif from "./PanelNotif";
import AdminPanel from "./adminpanel";
import { auth, db } from "../firebase/config";
import { collection, query, where, onSnapshot} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";


const MapView = () => {
  const { user, role } = useAuth();
  const markersRef = React.useRef(null);
  const [showPanelNotif, setShowPanelNotif] = React.useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [view, setView] = React.useState('markers');
  const [approvedPoints, setApprovedPoints] = React.useState([]);
  const [isFollowing, setIsFollowing] = React.useState(false);
//Puntos aprobados  
React.useEffect(() => {
  const q = query(
    collection(db, 'markers'),
    where('status', '==', 'aprobado')
  );
  const unsub = onSnapshot(q, (snap) => {
    setApprovedPoints(
      snap.docs.map((d) => ({
        lat: d.data().lat,
        lng: d.data().lng,
      }))
    );
  });
  return () => unsub();
  }, []);

//Notificaciones
React.useEffect(() => {
  if (!user) return;
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", user.uid),
    where("read", "==", false)
  );
  const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.size));
  return () => unsub();
}, [user]);

//Cerrar sesión
  const handleLogout = async () => {
    await signOut(auth);
  };
//Función para ubicar el marcador en la ubicación actual
  const handleLocateClick = () => {
   markersRef.current?.useCurrentLocation();
  };

const handleFollowClick = () => {
  if (markersRef.current) {
    markersRef.current.FollowUser();
    setIsFollowing((prev) => !prev);
  }
};
  return (
    <div style={{ position: "relative", height: "100vh", width: "100%", overflow: "hidden" }}>
      <div style={styles.topBar}>
        <span style={styles.greeting}>
          {user?.displayName || user?.email}
        </span>
        <span style={styles.hint}>Portoviejo</span>
        <button
          style={{
            ...styles.adminBtn,
            backgroundColor: adminPanelOpen ? "#1e3a5f" : "#3b82f6",
          }}
        onClick={() => setView((v)=> v === 'markers' ? 'heatmap' : 'markers')}
      >
        {view === 'markers' ? 'Ver mapa de calor' : 'Ver marcadores'}
      </button>

        {role !== "admin" && (
          <button
            style={{ ...styles.bellBtn }}
            onClick={() => setShowPanelNotif((prev) => !prev)}
            title="Notificaciones"
          >
            🔔
            {unreadCount > 0 && (
              <span style={styles.badge}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )}

        {role === "admin" && (
          <button
            style={{
              ...styles.adminBtn,
              backgroundColor: adminPanelOpen ? "#1e3a5f" : "#3b82f6",
            }}
            onClick={() => setAdminPanelOpen((prev) => !prev)}
          >
            {adminPanelOpen ? "Cerrar reportes" : "Reportes"}
          </button>
        )}
          

        <button style={styles.logoutBtn} onClick={handleLogout}>Cerrar sesión</button>
      </div>
      
      <MapContainer
        center={[-1.0388699521021827, -80.49726604495315]}
        zoom={17} 
        zoomControl={false}
      >
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {view === 'markers' && <Markers ref={markersRef} />}
        {view === 'heatmap' && <HeatmapLayer points={approvedPoints} />}
        <ZoomControl position="bottomleft" />
      </MapContainer>
      

      <button
        style={styles.locateBtn}
        onClick={handleLocateClick}
        title="Agregar marcador en ubicación actual"></button>
      <button
        style={{ ...styles.locateBtn, bottom: "90px" }}
        onClick={handleFollowClick}
        title={isFollowing ? "Dejar de seguir" : "Seguir ubicación actual"}>
        {isFollowing ? "D" : "A"}
      </button>
    {/*Renderizar los paneles de administración y notificaciones según el estado*/}
      {adminPanelOpen && (
        <AdminPanel onClose={() => setAdminPanelOpen(false)} />)}
      {showPanelNotif && (
        <PanelNotif onClose={() => setShowPanelNotif(false)} />
      )}
      

    
    </div>
    
  );
  
};

const styles = {
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  greeting: { fontSize: "14px", fontWeight: "bold", color: "#333" },
  hint: { fontSize: "13px", color: "#666" },
  logoutBtn: {
    padding: "6px 14px",
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
    locateBtn: {
    position: "fixed",
    bottom: "20px",
    right: "16px",
    zIndex: 1000, 
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    fontSize: "22px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
adminBtn: {
  padding: "6px 12px",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "bold",
},
bellBtn: {
  position: "relative",
  background: "none",
  border: "none",
  fontSize: "22px",
  cursor: "pointer",
  padding: "4px",
},
badge: {
  position: "absolute",
  top: "-2px",
  right: "-4px",
  backgroundColor: "#ef4444",
  color: "#fff",
  fontSize: "10px",
  fontWeight: "bold",
  borderRadius: "50%",
  minWidth: "18px",
  height: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 3px",
},
};

export default MapView;
