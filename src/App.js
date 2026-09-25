
import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import MapView from "./components/MapView";
import Login from "./components/Login";
import Register from "./components/Register";

import "./App.css";


const AppContent = () => {
  const { user } = useAuth();
  const [screen, setScreen] = useState("login");

 
  if (user) return <MapView />;


  if (screen === "register") {
    return <Register onGoToLogin={() => setScreen("login")} />;
  }

  return <Login onGoToRegister={() => setScreen("register")} />;
};


const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
