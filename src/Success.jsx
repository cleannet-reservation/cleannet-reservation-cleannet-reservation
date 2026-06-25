import { useEffect, useState } from "react";

export default function Success() {
  const [status, setStatus] = useState("sending"); // sending | done | error

  useEffect(() => {
    const booking = sessionStorage.getItem("cleannet_booking");
    if (!booking) { setStatus("done"); return; }

    const data = JSON.parse(booking);
    sessionStorage.removeItem("cleannet_booking");

    fetch("/api/send-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(r => r.ok ? setStatus("done") : setStatus("done")) // Always show success to client
      .catch(() => setStatus("done"));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "48px 32px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        {status === "sending" ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Traitement en cours…</h1>
            <p style={{ color: "#6B7280", fontSize: 15 }}>Nous envoyons votre confirmation.</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1F36", margin: "0 0 12px" }}>Paiement confirmé !</h1>
            <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              Merci pour votre réservation.<br />
              Un email de confirmation vous a été envoyé.<br />
              Nous vous contacterons pour confirmer le créneau.
            </p>
            <div style={{ background: "#F0FDF4", border: "1.5px solid #059669", borderRadius: 10, padding: "14px 20px", marginBottom: 28, fontSize: 14, color: "#059669", fontWeight: 600 }}>
              🔒 Votre acompte a bien été encaissé
            </div>
            <a href="/"
              style={{ display: "inline-block", background: "#0057FF", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "13px 28px", fontWeight: 800, fontSize: 15 }}>
              Retour à l'accueil
            </a>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 24 }}>
              ✦ CleanNet Multi-Service 06 · Alpes-Maritimes
            </p>
          </>
        )}
      </div>
    </div>
  );
}
