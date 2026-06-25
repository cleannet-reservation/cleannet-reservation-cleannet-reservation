export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.BREVO_API_KEY) {
    return res.status(500).json({ error: "Brevo not configured" });
  }

  const {
    prenom, nom, email, telephone, adresse,
    service, option, date, creneau,
    total, acompte, message,
  } = req.body;

  const SENDER_EMAIL = process.env.SENDER_EMAIL || "contact@cleannet06.fr";
  const SENDER_NAME = "CleanNet Multi-Service 06";
  const OWNER_EMAIL = process.env.OWNER_EMAIL || SENDER_EMAIL;

  // ── Email au propriétaire ──────────────────────────────────────────────────
  const ownerHtml = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#F7F8FC;padding:24px;">
      <div style="background:#0057FF;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:20px;">✦ Nouvelle réservation reçue !</h1>
        <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">CleanNet Multi-Service 06</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        
        <h2 style="font-size:16px;color:#1A1F36;margin:0 0 16px;">👤 Client</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
          <tr><td style="padding:8px 0;color:#6B7280;width:140px;">Nom</td><td style="padding:8px 0;font-weight:600;color:#1A1F36;">${prenom} ${nom}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Email</td><td style="padding:8px 0;font-weight:600;color:#1A1F36;">${email}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Téléphone</td><td style="padding:8px 0;font-weight:600;color:#1A1F36;">${telephone}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Adresse</td><td style="padding:8px 0;font-weight:600;color:#1A1F36;">${adresse}</td></tr>
          ${message ? `<tr><td style="padding:8px 0;color:#6B7280;">Note</td><td style="padding:8px 0;color:#1A1F36;">${message}</td></tr>` : ""}
        </table>

        <h2 style="font-size:16px;color:#1A1F36;margin:0 0 16px;">🧹 Prestation</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
          <tr><td style="padding:8px 0;color:#6B7280;width:140px;">Service</td><td style="padding:8px 0;font-weight:600;color:#1A1F36;">${service}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Formule</td><td style="padding:8px 0;font-weight:600;color:#1A1F36;">${option}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Date</td><td style="padding:8px 0;font-weight:600;color:#1A1F36;">${date}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Créneau</td><td style="padding:8px 0;font-weight:600;color:#1A1F36;">${creneau}</td></tr>
        </table>

        <div style="background:#F7F8FC;border-radius:10px;padding:16px 20px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;">
            <span style="color:#6B7280;">Total estimé</span>
            <span style="font-weight:700;color:#1A1F36;">${total}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:15px;">
            <span style="color:#6B7280;">Acompte reçu</span>
            <span style="font-weight:800;color:#0057FF;">${acompte}</span>
          </div>
        </div>

        <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:20px;">
          CleanNet Multi-Service 06 · Alpes-Maritimes
        </p>
      </div>
    </div>
  `;

  // ── Email au client ────────────────────────────────────────────────────────
  const clientHtml = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#F7F8FC;padding:24px;">
      <div style="background:#0057FF;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:20px;">✅ Réservation confirmée !</h1>
        <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">CleanNet Multi-Service 06</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        
        <p style="font-size:15px;color:#1A1F36;line-height:1.6;">
          Bonjour <strong>${prenom}</strong>,<br><br>
          Votre demande de réservation a bien été reçue et votre acompte de <strong style="color:#0057FF;">${acompte}</strong> a été encaissé.<br>
          Nous vous confirmons votre intervention :
        </p>

        <div style="background:#EEF3FF;border:1.5px solid #0057FF;border-radius:10px;padding:16px 20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#6B7280;width:130px;">Service</td><td style="padding:6px 0;font-weight:700;color:#1A1F36;">${service} — ${option}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280;">Date</td><td style="padding:6px 0;font-weight:700;color:#1A1F36;">${date}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280;">Créneau</td><td style="padding:6px 0;font-weight:700;color:#1A1F36;">${creneau}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280;">Adresse</td><td style="padding:6px 0;font-weight:700;color:#1A1F36;">${adresse}</td></tr>
          </table>
        </div>

        <div style="background:#F7F8FC;border-radius:10px;padding:14px 20px;margin-bottom:20px;font-size:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="color:#6B7280;">Acompte réglé</span>
            <span style="font-weight:700;color:#059669;">${acompte} ✓</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#6B7280;">Solde à régler le jour J</span>
            <span style="font-weight:700;color:#1A1F36;">${total} − ${acompte}</span>
          </div>
        </div>

        <p style="font-size:14px;color:#6B7280;line-height:1.6;">
          Une question ? Contactez-nous :<br>
          📞 <strong>${process.env.COMPANY_PHONE || "06 00 00 00 00"}</strong><br>
          📧 <strong>${SENDER_EMAIL}</strong>
        </p>

        <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:24px;">
          CleanNet Multi-Service 06 · Alpes-Maritimes<br>
          Vous recevez cet email car vous avez effectué une réservation sur notre site.
        </p>
      </div>
    </div>
  `;

  // ── Envoi via Brevo ────────────────────────────────────────────────────────
  const sendEmail = async (to, toName, subject, html) => {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
      }),
    });
    return response.ok;
  };

  try {
    // Email au propriétaire
    await sendEmail(
      OWNER_EMAIL,
      SENDER_NAME,
      `🔔 Nouvelle réservation — ${prenom} ${nom} — ${date}`,
      ownerHtml
    );

    // Email au client
    await sendEmail(
      email,
      `${prenom} ${nom}`,
      `✅ Confirmation de votre réservation CleanNet — ${date}`,
      clientHtml
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Brevo error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
