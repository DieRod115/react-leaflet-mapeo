

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";

const Login = ({ onGoToRegister }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    let emailString = name.trim();
      if (!emailString.includes('@')) {
      emailString = `${emailString}@myapp.internal`;
      }
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, emailString, password);
    } catch (err) {
      setError("Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Iniciar sesión</h2>

        <input
          style={styles.input}
          type="text"
          placeholder="Nombre de usuario"

          value={name}

          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handleLogin} disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <p style={styles.link}>
          ¿No tienes cuenta?{" "}
          <span style={styles.linkText} onClick={onGoToRegister}>
            Regístrate
          </span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4f8",
  },
  card: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    width: "320px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  title: { textAlign: "center", marginBottom: "0.5rem", color: "#333" },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
  },
  error: { color: "red", fontSize: "13px", textAlign: "center" },
  link: { textAlign: "center", fontSize: "13px", color: "#555" },
  linkText: { color: "#3b82f6", cursor: "pointer", fontWeight: "bold" },
};

export default Login;
