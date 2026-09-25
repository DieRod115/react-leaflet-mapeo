
import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase/config";

const Register = ({ onGoToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const usuariofalso = `${name}@myapp.internal`;
    setError("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, usuariofalso, password);
      
      await updateProfile(result.user, { displayName: name });
      
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este usuario ya existe.");
      } else {
        setError("Error al crear la cuenta. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Crear cuenta</h2>

        <input
          style={styles.input}
          type="text"
          placeholder="Nombre de usuario anónimo. Ej: Usuario1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
       {/*} <input
          style={styles.input}
          type="email"
          placeholder="Correo electrónico (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />*/}
        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handleRegister} disabled={loading}>
          {loading ? "Creando cuenta..." : "Registrarse"}
        </button>

        <p style={styles.link}>
          ¿Ya tienes cuenta?{" "}
          <span style={styles.linkText} onClick={onGoToLogin}>
            Inicia sesión
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
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
  },
  error: { color: "red", fontSize: "13px", textAlign: "center" },
  link: { textAlign: "center", fontSize: "13px", color: "#555" },
  linkText: { color: "#10b981", cursor: "pointer", fontWeight: "bold" },
};

export default Register;
