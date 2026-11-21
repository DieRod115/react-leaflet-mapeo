export const INCIDENTS = ["Robo", "Asalto", "Acoso", "Violencia", "Otro"];

export const incidentColor = (incident) => {
  if (incident === "Robo") return "#e97979";
  if (incident === "Asalto") return "#f59e0b";
  if (incident === "Acoso") return "#8b5cf6";
  if (incident === "Violencia") return "#440b0b";
  if (incident === "Otro") return "#3b82f6";
  return "#6b7280";
};
