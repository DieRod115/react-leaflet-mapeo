import React from "react";

const styles = {
  input: {
    padding: "7px",
    borderRadius: "6px",
    border: "1px solid #3f3f3f",
    backgroundColor: "#2a2a2a",
    color: "#f5f5f5",
    fontSize: "13px",
    width: "100%",
    boxSizing: "border-box",
    display: "block",
    margin: 0,
    fontFamily: "inherit",
    lineHeight: "1.4",
    textAlign: "left",
  },
};

const Incidentes = ({ value, onChange }) => {
  return (
    <select style={styles.input} value={value} onChange={onChange}>
      <option value="">Seleccionar incidente</option>
      <option value="Robo">Robo</option>
      <option value="Asalto">Asalto</option>
      <option value="Acoso">Acoso</option>
      <option value="Violencia">Violencia</option>
      <option value="Otro">Otro</option>
    </select>
  );
};

export default Incidentes;