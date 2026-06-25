import { useState, useEffect } from "react";

// ─── STORAGE KEY ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "cleannet_config";
const PWD_KEY = "cleannet_pwd";
const DEFAULT_PASSWORD = "cleannet2026";

function getPassword() {
  try { return localStorage.getItem(PWD_KEY) || DEFAULT_PASSWORD; } catch (_) { return DEFAULT_PASSWORD; }
}
function setPassword(pwd) {
  try { localStorage.setItem(PWD_KEY, pwd); } catch (_) {}
}

// ─── DEFAULT CONFIG ───────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  company: {
    name: "CleanNet Multi-Service 06",
    tagline: "Nettoyage professionnel à domicile",
    phone: "06 00 00 00 00",
    email: "contact@cleannet06.fr",
    zone: "Alpes-Maritimes",
    acomptePercent: 30,
    accentColor: "#0057FF",
  },
  services: [
    {
      id: "canape", icon: "🛋️", name: "Nettoyage Canapé",
      description: "Nettoyage en profondeur, détachage et désodorisation",
      options: [
        { id: "c1", label: "2 places", price: 89, duration: 60 },
        { id: "c2", label: "3 places", price: 109, duration: 90 },
        { id: "c3", label: "Canapé d'angle", price: 139, duration: 120 },
      ],
    },
    {
      id: "matelas", icon: "🛏️", name: "Nettoyage Matelas",
      description: "Assainissement, anti-acariens et désodorisation",
      options: [
        { id: "m1", label: "1 personne (90×190)", price: 69, duration: 45 },
        { id: "m2", label: "2 personnes (140×190)", price: 89, duration: 60 },
        { id: "m3", label: "King size (160×200+)", price: 109, duration: 90 },
      ],
    },
    {
      id: "voiture", icon: "🚗", name: "Nettoyage Voiture",
      description: "Intérieur complet, sièges, moquettes, tableau de bord",
      options: [
        { id: "v1", label: "Citadine / Berline", price: 79, duration: 90 },
        { id: "v2", label: "SUV / Monospace", price: 99, duration: 120 },
        { id: "v3", label: "Van / Utilitaire", price: 129, duration: 150 },
      ],
    },
    {
      id: "chantier", icon: "🏗️", name: "Après-Chantier",
      description: "Nettoyage fin de chantier, poussières, résidus de travaux",
      options: [
        { id: "ch1", label: "Jusqu'à 50 m²", price: 149, duration: 120 },
        { id: "ch2", label: "50 à 100 m²", price: 249, duration: 180 },
        { id: "ch3", label: "100 à 200 m²", price: 399, duration: 300 },
      ],
    },
    {
      id: "vitres", icon: "🪟", name: "Nettoyage Vitres",
      description: "Vitres intérieur/extérieur, sans traces, résultat brillant",
      options: [
        { id: "vi1", label: "Appartement (≤ 80 m²)", price: 59, duration: 60 },
        { id: "vi2", label: "Maison (≤ 150 m²)", price: 99, duration: 120 },
        { id: "vi3", label: "Commerce / Bureau", price: 129, duration: 150 },
      ],
    },
    {
      id: "moquette", icon: "🏠", name: "Nettoyage Moquette",
      description: "Extraction profonde, détachage, séchage rapide",
      options: [
        { id: "mo1", label: "À la pièce", price: 49, duration: 45 },
        { id: "mo2", label: "Forfait 3 pièces", price: 129, duration: 120 },
        { id: "mo3", label: "Forfait 5 pièces", price: 199, duration: 180 },
      ],
    },
  ],
  upsells: [],
  availability: {
    daySchedules: {
      0: { active: false, start: "08:00", end: "18:00" }, // Dimanche
      1: { active: true,  start: "08:00", end: "18:00" }, // Lundi
      2: { active: true,  start: "08:00", end: "18:00" }, // Mardi
      3: { active: true,  start: "08:00", end: "18:00" }, // Mercredi
      4: { active: true,  start: "08:00", end: "18:00" }, // Jeudi
      5: { active: true,  start: "08:00", end: "18:00" }, // Vendredi
      6: { active: false, start: "09:00", end: "13:00" }, // Samedi
    },
    blockedDates: [],
    googleCalendarUrl: "",
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toFixed(2).replace(".", ",") + " €";
const uid = () => Math.random().toString(36).slice(2, 8);
const today = () => new Date().toISOString().split("T")[0];

const fmtDuration = (minutes) => {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
};

const generateSlots = (startTime, endTime, durationMinutes) => {
  if (!startTime || !endTime || !durationMinutes) return [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startTotal = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  const slots = [];
  for (let t = startTotal; t + durationMinutes <= endTotal; t += 30) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    const endMin = t + durationMinutes;
    const eh2 = String(Math.floor(endMin / 60)).padStart(2, "0");
    const em2 = String(endMin % 60).padStart(2, "0");
    slots.push({ start: `${hh}:${mm}`, end: `${eh2}:${em2}` });
  }
  return slots;
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return DEFAULT_CONFIG;
}
function saveConfig(cfg) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch (_) {}
}

// ─── BOOKING STEPS ────────────────────────────────────────────────────────────
const STEPS = ["Service", "Options", "Coordonnées", "Récapitulatif"];

function ProgressBar({ step, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "20px 24px 0" }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0, zIndex: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, transition: "all 0.2s",
            background: i <= step ? color : "#E5E7EB",
            color: i <= step ? "#fff" : "#9CA3AF",
            boxShadow: i === step ? `0 0 0 3px ${color}22` : "none",
          }}>
            {i < step ? "✓" : i + 1}
          </div>
          <span style={{
            fontSize: 11, marginLeft: 5, fontWeight: i <= step ? 700 : 500,
            color: i <= step ? color : "#9CA3AF", whiteSpace: "nowrap",
          }}>{label}</span>
          {i < STEPS.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 6px",
              background: i < step ? color : "#E5E7EB", transition: "background 0.2s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── MINI CALENDAR ────────────────────────────────────────────────────────────
const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function MiniCalendar({ availability, selected, onSelect, color }) {
  const schedules = availability?.daySchedules || {
    0:{active:false,start:"08:00",end:"18:00"},1:{active:true,start:"08:00",end:"18:00"},
    2:{active:true,start:"08:00",end:"18:00"},3:{active:true,start:"08:00",end:"18:00"},
    4:{active:true,start:"08:00",end:"18:00"},5:{active:true,start:"08:00",end:"18:00"},
    6:{active:false,start:"09:00",end:"13:00"},
  };
  const activeDays = Object.entries(schedules).filter(([,v]) => v.active).map(([k]) => Number(k));

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const isAvailable = (d) => {
    const date = new Date(viewYear, viewMonth, d);
    const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const today2 = new Date(); today2.setHours(0,0,0,0);
    if (date < today2) return false;
    if ((availability?.blockedDates || []).includes(dateStr)) return false;
    if (!activeDays.includes(date.getDay())) return false;
    return true;
  };

  const getSchedule = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return schedules[d.getDay()] || null;
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: color, color: "#fff" }}>
        <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 700, padding: "0 6px" }}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{MONTHS_FR[viewMonth]} {viewYear}</span>
        <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 700, padding: "0 6px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#F7F8FC" }}>
        {DAYS_FR.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9CA3AF", padding: "8px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px" }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const avail = isAvailable(d);
          const isSel = selected === dateStr;
          return (
            <button key={d} disabled={!avail} onClick={() => onSelect(dateStr)}
              style={{
                margin: 2, borderRadius: 8, border: "none", padding: "8px 4px",
                fontWeight: isSel ? 800 : 500, fontSize: 13,
                background: isSel ? color : avail ? "#fff" : "transparent",
                color: isSel ? "#fff" : avail ? "#1A1F36" : "#D1D5DB",
                cursor: avail ? "pointer" : "not-allowed",
                boxShadow: isSel ? `0 2px 8px ${color}55` : "none",
              }}>
              {d}
            </button>
          );
        })}
      </div>
      {selected && getSchedule(selected) && (
        <div style={{ padding: "10px 16px 14px", borderTop: "1px solid #E5E7EB", fontSize: 13, color: "#374151" }}>
          ✅ <strong>{selected}</strong> — {getSchedule(selected).start} à {getSchedule(selected).end}
        </div>
      )}
      <div style={{ padding: "0 16px 12px", fontSize: 12, color: "#9CA3AF" }}>
        Jours disponibles : {activeDays.map(d => DAYS_FR[d]).join(", ")}
      </div>
    </div>
  );
}

function BookingFlow({ config }) {
  const { company, services, upsells, availability } = config;
  const color = company.accentColor || "#0057FF";
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [option, setOption] = useState(null);
  const [activeUpsells, setActiveUpsells] = useState([]);
  const [form, setForm] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  const canNext = () => {
    if (step === 0) return !!service;
    if (step === 1) return !!option;
    if (step === 2) return !!(form.prenom && form.nom && form.email && form.telephone && form.adresse && form.date && form.timeSlot);
    return true;
  };

  const upsellTotal = upsells.filter(u => activeUpsells.includes(u.id)).reduce((s, u) => s + Number(u.price), 0);
  const subtotal = (option ? Number(option.price) : 0) + upsellTotal;
  const acompte = subtotal * (Number(company.acomptePercent) / 100);

  const handlePay = async () => {
    setPaying(true);
    setPayError(null);
    try {
      // Save booking data to sessionStorage so success page can send confirmation email
      sessionStorage.setItem("cleannet_booking", JSON.stringify({
        prenom: form.prenom, nom: form.nom, email: form.email,
        telephone: form.telephone, adresse: form.adresse,
        service: service.name, option: option.label,
        date: form.date, creneau: `${form.timeSlot} → ${form.timeSlotEnd}`,
        total: fmt(subtotal), acompte: fmt(acompte),
        message: form.message || "",
      }));

      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(acompte * 100),
          currency: "eur",
          customerEmail: form.email,
          description: `Acompte ${company.acomptePercent}% — ${service.name} (${option.label}) — ${form.date} ${form.timeSlot}`,
          metadata: {
            prenom: form.prenom, nom: form.nom, telephone: form.telephone,
            adresse: form.adresse, service: service.name, option: option.label,
            date: form.date, creneau: `${form.timeSlot} → ${form.timeSlotEnd}`,
            total_estime: subtotal.toFixed(2), acompte: acompte.toFixed(2),
          },
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPayError("Erreur lors de la création du paiement. Veuillez réessayer.");
      }
    } catch (e) {
      setPayError("Impossible de contacter le serveur de paiement. Vérifiez votre connexion.");
    } finally {
      setPaying(false);
    }
  };

  if (confirmed) return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 12px" }}>Demande envoyée !</h2>
      <p style={{ color: "#6B7280", lineHeight: 1.7, marginBottom: 20 }}>
        Merci <strong>{form.prenom}</strong>, votre demande a été reçue.<br />
        Nous confirmons le créneau du <strong>{form.date}</strong> par email sous 24h.
      </p>
      <div style={{ background: "#F7F8FC", borderRadius: 10, padding: "14px 20px", display: "inline-block", textAlign: "left", fontSize: 14, lineHeight: 2 }}>
        <p>📧 <strong>{form.email}</strong></p>
        <p>📞 {form.telephone}</p>
      </div>
      <br />
      <button onClick={() => { setConfirmed(false); setStep(0); setService(null); setOption(null); setActiveUpsells([]); setForm({}); }}
        style={{ marginTop: 24, background: color, color: "#fff", border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        Nouvelle réservation
      </button>
    </div>
  );

  return (
    <div>
      <ProgressBar step={step} color={color} />

      <div style={{ padding: "24px 24px 8px" }}>

        {/* STEP 0 — Service */}
        {step === 0 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>Quelle prestation souhaitez-vous ?</h2>
            <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 18px" }}>Sélectionnez un service pour commencer</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 12 }}>
              {services.map(s => (
                <button key={s.id} onClick={() => { setService(s); setOption(null); }}
                  style={{
                    border: `2px solid ${service?.id === s.id ? color : "#E5E7EB"}`,
                    background: service?.id === s.id ? color + "11" : "#fff",
                    borderRadius: 12, padding: "16px 12px", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, textAlign: "left",
                  }}>
                  <span style={{ fontSize: 26 }}>{s.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span>
                  <span style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4 }}>{s.description}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color, marginTop: 4 }}>
                    À partir de {fmt(Math.min(...s.options.map(o => o.price)))}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP 1 — Options + Upsells */}
        {step === 1 && service && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>{service.icon} {service.name}</h2>
            <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 16px" }}>Choisissez votre formule</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {service.options.map(opt => (
                <button key={opt.id} onClick={() => setOption(opt)}
                  style={{
                    border: `2px solid ${option?.id === opt.id ? color : "#E5E7EB"}`,
                    background: option?.id === opt.id ? color + "11" : "#fff",
                    borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color }}>{fmt(opt.price)}</span>
                    {option?.id === opt.id && (
                      <span style={{ background: color, color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {upsells.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>✨ Ajoutez un service complémentaire</h3>
                <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 14px" }}>Profitez-en pour combiner vos prestations</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {upsells.map(u => {
                    const active = activeUpsells.includes(u.id);
                    return (
                      <button key={u.id} onClick={() => setActiveUpsells(prev => active ? prev.filter(x => x !== u.id) : [...prev, u.id])}
                        style={{
                          border: `2px solid ${active ? "#059669" : "#E5E7EB"}`,
                          background: active ? "#F0FDF4" : "#fff",
                          borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 12,
                        }}>
                        <span style={{ fontSize: 22 }}>{u.icon}</span>
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                          <div style={{ fontSize: 13, color: "#059669", fontWeight: 700 }}>+{fmt(u.price)}</div>
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                          background: active ? "#DCFCE7" : color + "11",
                          color: active ? "#059669" : color,
                        }}>{active ? "✓ Ajouté" : "+ Ajouter"}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* STEP 2 — Form */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>Vos coordonnées</h2>
            <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 18px" }}>Nous confirmerons le rendez-vous par email</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { id: "prenom", label: "Prénom", type: "text", ph: "Marie" },
                { id: "nom", label: "Nom", type: "text", ph: "Dupont" },
                { id: "email", label: "Email", type: "email", ph: "marie@exemple.fr", full: true },
                { id: "telephone", label: "Téléphone", type: "tel", ph: "06 12 34 56 78" },
                { id: "adresse", label: "Adresse d'intervention", type: "text", ph: "12 rue des Fleurs, Nice", full: true },
              ].map(f => (
                <div key={f.id} style={{ gridColumn: f.full ? "1 / -1" : undefined, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</label>
                  <input type={f.type} style={inputStyle} placeholder={f.ph}
                    value={form[f.id] || ""} onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))} />
                </div>
              ))}

              {/* Smart Calendar */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Date souhaitée</label>
                <MiniCalendar
                  availability={availability}
                  selected={form.date}
                  onSelect={d => setForm(p => ({ ...p, date: d, timeSlot: null }))}
                  color={color}
                />
              </div>

              {/* Time slot picker */}
              {form.date && option && (() => {
                const dateObj = new Date(form.date);
                const daySched = availability?.daySchedules?.[dateObj.getDay()];
                const duration = Number(option.duration) || 60;
                const slots = daySched ? generateSlots(daySched.start, daySched.end, duration) : [];
                return (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                      Créneau horaire
                      <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, marginLeft: 8 }}>
                        Durée estimée : {fmtDuration(duration)}
                      </span>
                    </label>
                    {slots.length === 0 ? (
                      <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#DC2626" }}>
                        Aucun créneau disponible pour cette date. Veuillez choisir un autre jour.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
                        {slots.map(slot => {
                          const isSelected = form.timeSlot === slot.start;
                          return (
                            <button key={slot.start}
                              onClick={() => setForm(p => ({ ...p, timeSlot: slot.start, timeSlotEnd: slot.end }))}
                              style={{
                                border: `2px solid ${isSelected ? color : "#E5E7EB"}`,
                                background: isSelected ? color : "#fff",
                                color: isSelected ? "#fff" : "#1A1F36",
                                borderRadius: 10, padding: "10px 8px", cursor: "pointer",
                                fontWeight: isSelected ? 800 : 600, fontSize: 13,
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                                transition: "all 0.15s",
                              }}>
                              <span style={{ fontSize: 15 }}>{slot.start}</span>
                              <span style={{ fontSize: 11, opacity: 0.75 }}>→ {slot.end}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Infos complémentaires (optionnel)</label>
                <textarea style={{ ...inputStyle, height: 70, resize: "vertical" }} placeholder="Accès, étage, particularités…" rows={3}
                  value={form.message || ""} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
              </div>
            </div>
          </>
        )}

        {/* STEP 3 — Recap */}
        {step === 3 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px" }}>Récapitulatif</h2>
            <div style={recapCard}>
              <Row label={`${service.icon} ${service.name}`} val={option?.label} />
              <Row label="Prix de base" val={fmt(option?.price || 0)} />
              {upsells.filter(u => activeUpsells.includes(u.id)).map(u => (
                <Row key={u.id} label={`${u.icon} ${u.name}`} val={`+${fmt(u.price)}`} />
              ))}
              <div style={{ height: 1, background: "#E5E7EB", margin: "8px 0" }} />
              <Row label="Total estimé" val={fmt(subtotal)} bold />
              <Row label={`Acompte (${company.acomptePercent}%)`} val={fmt(acompte)} color={color} />
            </div>
            <div style={recapCard}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>Détails</p>
              <Row label="Client" val={`${form.prenom} ${form.nom}`} />
              <Row label="Date" val={form.date} />
              {form.timeSlot && <Row label="Créneau" val={`${form.timeSlot} → ${form.timeSlotEnd} (${fmtDuration(Number(option?.duration))})`} />}
              <Row label="Adresse" val={form.adresse} />
              {form.message && <Row label="Note" val={form.message} />}
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: color + "11", border: `1.5px solid ${color}`, borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 14, lineHeight: 1.5 }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <div>
                <strong>Acompte de {fmt(acompte)}</strong> pour bloquer votre créneau<br />
                <span style={{ fontSize: 12, color: "#6B7280" }}>Le solde de {fmt(subtotal - acompte)} sera réglé le jour de l'intervention</span>
              </div>
            </div>
            {payError && (
              <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#DC2626", marginBottom: 14 }}>
                ⚠️ {payError}
              </div>
            )}
            <button onClick={handlePay} disabled={paying}
              style={{ width: "100%", background: paying ? "#9CA3AF" : color, color: "#fff", border: "none", borderRadius: 10, padding: 16, fontSize: 15, fontWeight: 800, cursor: paying ? "not-allowed" : "pointer" }}>
              {paying ? "⏳ Redirection vers Stripe..." : `Confirmer et payer l'acompte — ${fmt(acompte)}`}
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 10 }}>🔐 Paiement sécurisé via Stripe · SSL</p>
          </>
        )}
      </div>

      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 24px 24px", borderTop: "1px solid #E5E7EB", gap: 12, marginTop: 8 }}>
        {step > 0
          ? <button onClick={() => setStep(s => s - 1)} style={backBtn}>← Retour</button>
          : <div />
        }
        {step < 3 && (
          <button onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()}
            style={{ ...nextBtn, background: canNext() ? color : "#E5E7EB", color: canNext() ? "#fff" : "#9CA3AF", cursor: canNext() ? "pointer" : "not-allowed" }}>
            {step === 2 ? "Voir le récapitulatif →" : "Continuer →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── BLOCKED DATES PICKER ─────────────────────────────────────────────────────
function BlockedDatesPicker({ blockedDates, onChange, color }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const toStr = (d) => `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const isPast = (d) => {
    const date = new Date(viewYear, viewMonth, d);
    const t = new Date(); t.setHours(0,0,0,0);
    return date < t;
  };

  const toggle = (d) => {
    const str = toStr(d);
    if (blockedDates.includes(str)) {
      onChange(blockedDates.filter(x => x !== str));
    } else {
      onChange([...blockedDates, str].sort());
    }
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const blockedThisMonth = blockedDates.filter(d => d.startsWith(`${viewYear}-${String(viewMonth+1).padStart(2,"0")}`)).length;

  return (
    <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#1A1F36", color: "#fff" }}>
        <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 700, padding: "0 8px" }}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{MONTHS_FR[viewMonth]} {viewYear}</div>
          {blockedThisMonth > 0 && (
            <div style={{ fontSize: 11, color: "#FCA5A5", marginTop: 2 }}>🚫 {blockedThisMonth} jour(s) bloqué(s) ce mois</div>
          )}
        </div>
        <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 700, padding: "0 8px" }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#F7F8FC" }}>
        {DAYS_FR.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9CA3AF", padding: "8px 0" }}>{d}</div>)}
      </div>

      {/* Cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px", background: "#fff" }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const str = toStr(d);
          const isBlocked = blockedDates.includes(str);
          const past = isPast(d);
          return (
            <button key={d}
              disabled={past}
              onClick={() => toggle(d)}
              title={isBlocked ? `Cliquer pour débloquer le ${str}` : `Cliquer pour bloquer le ${str}`}
              style={{
                margin: 2, borderRadius: 8, border: isBlocked ? "2px solid #DC2626" : "2px solid transparent",
                padding: "8px 4px", fontSize: 13, cursor: past ? "not-allowed" : "pointer",
                fontWeight: isBlocked ? 800 : 400,
                background: isBlocked ? "#FEE2E2" : past ? "transparent" : "#F7F8FC",
                color: isBlocked ? "#DC2626" : past ? "#D1D5DB" : "#1A1F36",
                position: "relative",
                transition: "all 0.1s",
              }}>
              {d}
              {isBlocked && (
                <span style={{ position: "absolute", top: 1, right: 3, fontSize: 8, color: "#DC2626" }}>🚫</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 16, fontSize: 12, color: "#6B7280" }}>
        <span>💡 Cliquez sur un jour pour le bloquer</span>
        <span style={{ color: "#DC2626", fontWeight: 600 }}>🚫 = Bloqué (cliquez pour débloquer)</span>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ config, onSave, onClose }) {
  const [cfg, setCfg] = useState(JSON.parse(JSON.stringify(config)));
  const [tab, setTab] = useState("company");
  const [saved, setSaved] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdMsg, setPwdMsg] = useState(null);
  const [stripeKey, setStripeKey] = useState(() => { try { return localStorage.getItem("cleannet_stripe") || ""; } catch(_) { return ""; } });
  const [stripeSaved, setStripeSaved] = useState(false);
  const [stripeMode, setStripeMode] = useState(() => { try { return localStorage.getItem("cleannet_stripe_mode") || "test"; } catch(_) { return "test"; } });

  const color = cfg.company.accentColor || "#0057FF";

  const save = () => { onSave(cfg); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  // Company tab
  const setCompany = (k, v) => setCfg(c => ({ ...c, company: { ...c.company, [k]: v } }));

  // Services
  const updateService = (si, field, val) => setCfg(c => {
    const svcs = [...c.services];
    svcs[si] = { ...svcs[si], [field]: val };
    return { ...c, services: svcs };
  });
  const updateOption = (si, oi, field, val) => setCfg(c => {
    const svcs = [...c.services];
    const opts = [...svcs[si].options];
    opts[oi] = { ...opts[oi], [field]: val };
    svcs[si] = { ...svcs[si], options: opts };
    return { ...c, services: svcs };
  });
  const addOption = (si) => setCfg(c => {
    const svcs = [...c.services];
    svcs[si] = { ...svcs[si], options: [...svcs[si].options, { id: uid(), label: "Nouvelle option", price: 0 }] };
    return { ...c, services: svcs };
  });
  const removeOption = (si, oi) => setCfg(c => {
    const svcs = [...c.services];
    const opts = svcs[si].options.filter((_, i) => i !== oi);
    svcs[si] = { ...svcs[si], options: opts };
    return { ...c, services: svcs };
  });
  const addService = () => setCfg(c => ({
    ...c,
    services: [...c.services, { id: uid(), icon: "🧹", name: "Nouveau service", description: "Description du service", options: [{ id: uid(), label: "Option 1", price: 0 }] }],
  }));
  const removeService = (si) => setCfg(c => ({ ...c, services: c.services.filter((_, i) => i !== si) }));

  // Upsells
  const updateUpsell = (ui, field, val) => setCfg(c => {
    const ups = [...c.upsells];
    ups[ui] = { ...ups[ui], [field]: val };
    return { ...c, upsells: ups };
  });
  const addUpsell = () => setCfg(c => ({
    ...c, upsells: [...c.upsells, { id: uid(), icon: "⭐", name: "Nouvel upsell", price: 0 }],
  }));
  const removeUpsell = (ui) => setCfg(c => ({ ...c, upsells: c.upsells.filter((_, i) => i !== ui) }));

  const tabs = [
    { id: "company", label: "🏢 Entreprise" },
    { id: "services", label: "🧹 Services" },
    { id: "upsells", label: "✨ Upsells" },
    { id: "availability", label: "📅 Disponibilités" },
    { id: "stripe", label: "💳 Stripe" },
    { id: "publish", label: "🚀 Publier" },
    { id: "password", label: "🔑 Mot de passe" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 12px", overflowY: "auto" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

        {/* Admin Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #E5E7EB" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>⚙️ Panneau d'administration</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>Modifiez tout sans toucher au code</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={save} style={{ background: saved ? "#059669" : color, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {saved ? "✓ Sauvegardé !" : "Sauvegarder"}
            </button>
            <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151" }}>✕ Fermer</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", padding: "0 24px", overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ border: "none", background: "none", padding: "12px 16px", fontWeight: tab === t.id ? 700 : 500, fontSize: 14, color: tab === t.id ? color : "#6B7280", cursor: "pointer", borderBottom: `2px solid ${tab === t.id ? color : "transparent"}`, marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "24px", maxHeight: "65vh", overflowY: "auto" }}>

          {/* TAB: Company */}
          {tab === "company" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <AdminSection title="Identité">
                <AdminField label="Nom de l'entreprise" value={cfg.company.name} onChange={v => setCompany("name", v)} />
                <AdminField label="Slogan / tagline" value={cfg.company.tagline} onChange={v => setCompany("tagline", v)} />
                <AdminField label="Zone d'intervention" value={cfg.company.zone} onChange={v => setCompany("zone", v)} />
              </AdminSection>
              <AdminSection title="Contact">
                <AdminField label="Téléphone" value={cfg.company.phone} onChange={v => setCompany("phone", v)} />
                <AdminField label="Email" type="email" value={cfg.company.email} onChange={v => setCompany("email", v)} />
              </AdminSection>
              <AdminSection title="Paiement & Apparence">
                <AdminField label="Acompte (%)" type="number" value={cfg.company.acomptePercent} onChange={v => setCompany("acomptePercent", v)} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Couleur principale</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="color" value={cfg.company.accentColor} onChange={e => setCompany("accentColor", e.target.value)}
                      style={{ width: 44, height: 36, border: "1.5px solid #E5E7EB", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                    <span style={{ fontSize: 13, color: "#6B7280" }}>{cfg.company.accentColor}</span>
                  </div>
                </div>
              </AdminSection>
            </div>
          )}

          {/* TAB: Services */}
          {tab === "services" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {cfg.services.map((svc, si) => (
                <div key={svc.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ background: "#F7F8FC", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <input value={svc.icon} onChange={e => updateService(si, "icon", e.target.value)}
                      style={{ ...inputStyle, width: 48, textAlign: "center", fontSize: 18 }} />
                    <input value={svc.name} onChange={e => updateService(si, "name", e.target.value)}
                      style={{ ...inputStyle, flex: 1, fontWeight: 700 }} />
                    <button onClick={() => removeService(si)}
                      style={{ background: "#FEE2E2", border: "none", borderRadius: 6, padding: "6px 10px", color: "#DC2626", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
                      Supprimer
                    </button>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <AdminField label="Description" value={svc.description} onChange={v => updateService(si, "description", v)} />
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "14px 0 6px" }}>Options & Prix</p>
                    <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                      <span style={{ flex: 1, fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Label</span>
                      <span style={{ width: 70, fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Prix (€)</span>
                      <span style={{ width: 60, fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Durée</span>
                      <span style={{ width: 28 }} />
                    </div>
                    {svc.options.map((opt, oi) => (
                      <div key={opt.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                        <input value={opt.label} onChange={e => updateOption(si, oi, "label", e.target.value)}
                          style={{ ...inputStyle, flex: 1 }} placeholder="Label" />
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <input type="number" value={opt.price} onChange={e => updateOption(si, oi, "price", e.target.value)}
                            style={{ ...inputStyle, width: 70 }} />
                          <span style={{ fontSize: 12, color: "#6B7280" }}>€</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <input type="number" value={opt.duration || 60} onChange={e => updateOption(si, oi, "duration", e.target.value)}
                            style={{ ...inputStyle, width: 60 }} title="Durée en minutes" />
                          <span style={{ fontSize: 12, color: "#6B7280" }}>min</span>
                        </div>
                        <button onClick={() => removeOption(si, oi)}
                          style={{ background: "none", border: "1.5px solid #FCA5A5", borderRadius: 6, padding: "6px 8px", color: "#EF4444", cursor: "pointer", fontSize: 13 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => addOption(si)}
                      style={{ background: "none", border: `1.5px dashed ${color}`, borderRadius: 8, padding: "8px 14px", color, fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 4 }}>
                      + Ajouter une option
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addService}
                style={{ background: "none", border: `2px dashed ${color}`, borderRadius: 10, padding: "14px", color, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                + Ajouter un service
              </button>
            </div>
          )}

          {/* TAB: Upsells */}
          {tab === "upsells" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 8px" }}>
                Les upsells apparaissent à l'étape 2 pour augmenter le panier moyen.
              </p>
              {cfg.upsells.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 16px", background: "#F7F8FC", borderRadius: 12, color: "#9CA3AF", fontSize: 14 }}>
                  Aucun upsell pour l'instant. Ajoutez-en un ci-dessous !
                </div>
              )}
              {cfg.upsells.map((u, ui) => (
                <div key={u.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                  <input value={u.icon} onChange={e => updateUpsell(ui, "icon", e.target.value)}
                    style={{ ...inputStyle, width: 48, textAlign: "center", fontSize: 18 }} />
                  <input value={u.name} onChange={e => updateUpsell(ui, "name", e.target.value)}
                    style={{ ...inputStyle, flex: 1 }} placeholder="Nom de l'upsell" />
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input type="number" value={u.price} onChange={e => updateUpsell(ui, "price", e.target.value)}
                      style={{ ...inputStyle, width: 80 }} />
                    <span style={{ fontSize: 13, color: "#6B7280" }}>€</span>
                  </div>
                  <button onClick={() => removeUpsell(ui)}
                    style={{ background: "#FEE2E2", border: "none", borderRadius: 6, padding: "7px 10px", color: "#DC2626", fontWeight: 700, cursor: "pointer" }}>✕</button>
                </div>
              ))}
              <button onClick={addUpsell}
                style={{ background: "none", border: `2px dashed ${color}`, borderRadius: 10, padding: "14px", color, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                + Ajouter un upsell
              </button>
            </div>
          )}

          {/* TAB: Availability */}
          {tab === "availability" && (() => {
            const schedules = cfg.availability?.daySchedules || {};
            const updateDay = (dayIdx, field, val) => setCfg(c => ({
              ...c,
              availability: {
                ...c.availability,
                daySchedules: {
                  ...c.availability.daySchedules,
                  [dayIdx]: { ...(c.availability.daySchedules?.[dayIdx] || { active: false, start: "08:00", end: "18:00" }), [field]: val }
                }
              }
            }));

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                <AdminSection title="Horaires par jour">
                  <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 12px" }}>
                    Activez les jours travaillés et définissez les horaires pour chacun.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {DAYS_FR.map((dayLabel, i) => {
                      const dayCfg = schedules[i] || { active: false, start: "08:00", end: "18:00" };
                      return (
                        <div key={i} style={{
                          border: `2px solid ${dayCfg.active ? color : "#E5E7EB"}`,
                          borderRadius: 10, padding: "12px 14px",
                          background: dayCfg.active ? color + "08" : "#FAFAFA",
                          transition: "all 0.15s",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* Toggle */}
                            <button onClick={() => updateDay(i, "active", !dayCfg.active)}
                              style={{
                                width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                                background: dayCfg.active ? color : "#D1D5DB", position: "relative", flexShrink: 0,
                                transition: "background 0.2s",
                              }}>
                              <span style={{
                                position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
                                background: "#fff", transition: "left 0.2s",
                                left: dayCfg.active ? 21 : 3,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              }} />
                            </button>

                            {/* Day name */}
                            <span style={{ fontWeight: 700, fontSize: 14, width: 36, color: dayCfg.active ? "#1A1F36" : "#9CA3AF" }}>
                              {dayLabel}
                            </span>

                            {/* Time inputs */}
                            {dayCfg.active ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                                <input type="time" value={dayCfg.start}
                                  onChange={e => updateDay(i, "start", e.target.value)}
                                  style={{ ...inputStyle, width: 110, fontSize: 13, padding: "6px 10px" }} />
                                <span style={{ color: "#9CA3AF", fontWeight: 600, fontSize: 13 }}>→</span>
                                <input type="time" value={dayCfg.end}
                                  onChange={e => updateDay(i, "end", e.target.value)}
                                  style={{ ...inputStyle, width: 110, fontSize: 13, padding: "6px 10px" }} />
                              </div>
                            ) : (
                              <span style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic" }}>Jour non travaillé</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AdminSection>

                <AdminSection title="🚫 Dates bloquées (congés, jours fériés)">
                  <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 10px" }}>
                    Cliquez sur les jours à bloquer directement dans le calendrier. Cliquez à nouveau pour débloquer.
                  </p>
                  <BlockedDatesPicker
                    blockedDates={cfg.availability?.blockedDates || []}
                    onChange={dates => setCfg(c => ({ ...c, availability: { ...c.availability, blockedDates: dates } }))}
                    color={color}
                  />
                  {(cfg.availability?.blockedDates || []).length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>
                        {(cfg.availability?.blockedDates || []).length} jour(s) bloqué(s)
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(cfg.availability?.blockedDates || []).map(d => (
                          <div key={d} style={{ display: "flex", alignItems: "center", gap: 5, background: "#FEE2E2", borderRadius: 20, padding: "4px 10px 4px 12px", fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
                            🚫 {d}
                            <button onClick={() => setCfg(c => ({ ...c, availability: { ...c.availability, blockedDates: c.availability.blockedDates.filter(x => x !== d) } }))}
                              style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontWeight: 800, fontSize: 13, padding: 0 }}>✕</button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setCfg(c => ({ ...c, availability: { ...c.availability, blockedDates: [] } }))}
                        style={{ marginTop: 10, background: "none", border: "1.5px solid #FCA5A5", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "#DC2626", cursor: "pointer" }}>
                        Tout débloquer
                      </button>
                    </div>
                  )}
                </AdminSection>

                <AdminSection title="🔗 Google Calendar">
                  <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 8px", lineHeight: 1.6 }}>
                    Connectez votre Google Calendar pour synchroniser vos disponibilités.
                  </p>
                  <AdminField label="URL iCal Google Calendar" value={cfg.availability?.googleCalendarUrl || ""}
                    onChange={v => setCfg(c => ({ ...c, availability: { ...c.availability, googleCalendarUrl: v } }))} />
                  <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 700, color: "#374151", textDecoration: "none" }}>
                    📅 Ouvrir Google Calendar →
                  </a>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: "4px 0 0" }}>
                    Paramètres → votre agenda → "Intégrer l'agenda" → copiez l'adresse iCal publique.
                  </p>
                </AdminSection>
              </div>
            );
          })()}

          {/* TAB: Stripe */}
          {tab === "stripe" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Status badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: stripeKey.startsWith("pk_live") ? "#F0FDF4" : stripeKey.startsWith("pk_test") ? "#FFF7ED" : "#F7F8FC", border: `1.5px solid ${stripeKey.startsWith("pk_live") ? "#059669" : stripeKey.startsWith("pk_test") ? "#F59E0B" : "#E5E7EB"}`, borderRadius: 10, padding: "12px 16px" }}>
                <span style={{ fontSize: 22 }}>{stripeKey.startsWith("pk_live") ? "✅" : stripeKey.startsWith("pk_test") ? "🟡" : "⚪"}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {stripeKey.startsWith("pk_live") ? "Stripe connecté (mode production)" : stripeKey.startsWith("pk_test") ? "Stripe connecté (mode test)" : "Stripe non connecté"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>
                    {stripeKey.startsWith("pk_live") ? "Les paiements réels sont activés" : stripeKey.startsWith("pk_test") ? "Les paiements sont en mode test" : "Ajoutez votre clé pour activer les paiements"}
                  </div>
                </div>
              </div>

              <AdminSection title="Configuration Stripe">
                {/* Mode toggle */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Mode</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["test", "live"].map(m => (
                      <button key={m} onClick={() => { setStripeMode(m); try { localStorage.setItem("cleannet_stripe_mode", m); } catch(_){} }}
                        style={{ flex: 1, border: `2px solid ${stripeMode === m ? color : "#E5E7EB"}`, background: stripeMode === m ? color + "11" : "#fff", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer", color: stripeMode === m ? color : "#6B7280" }}>
                        {m === "test" ? "🧪 Test" : "🚀 Production"}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>
                    {stripeMode === "test" ? "Utilisez le mode test pour vérifier que tout fonctionne avant d'accepter de vrais paiements." : "Mode production : les vrais paiements sont encaissés."}
                  </p>
                </div>

                {/* Key input */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    Clé publique Stripe ({stripeMode === "test" ? "pk_test_..." : "pk_live_..."})
                  </label>
                  <input
                    type="text"
                    value={stripeKey}
                    onChange={e => setStripeKey(e.target.value)}
                    style={inputStyle}
                    placeholder={stripeMode === "test" ? "pk_test_xxxxxxxxxxxx" : "pk_live_xxxxxxxxxxxx"}
                  />
                </div>

                <button onClick={() => {
                  try { localStorage.setItem("cleannet_stripe", stripeKey); } catch(_){}
                  setStripeSaved(true); setTimeout(() => setStripeSaved(false), 2500);
                }} style={{ background: stripeSaved ? "#059669" : color, color: "#fff", border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {stripeSaved ? "✓ Clé sauvegardée !" : "Sauvegarder la clé Stripe"}
                </button>
              </AdminSection>

              <AdminSection title="Où trouver ma clé Stripe ?">
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
                  <p style={{ margin: "0 0 8px" }}>1. Connecte-toi sur <strong>dashboard.stripe.com</strong></p>
                  <p style={{ margin: "0 0 8px" }}>2. Clique sur <strong>Développeurs</strong> → <strong>Clés API</strong></p>
                  <p style={{ margin: "0 0 12px" }}>3. Copie la <strong>Clé publique</strong> (commence par pk_test_ ou pk_live_)</p>
                  <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer"
                    style={{ display: "inline-block", background: "#635BFF", color: "#fff", textDecoration: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 13 }}>
                    Ouvrir le dashboard Stripe →
                  </a>
                </div>
              </AdminSection>
            </div>
          )}

          {/* TAB: Publish */}
          {tab === "publish" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Deploy button */}
              <div style={{ background: "linear-gradient(135deg, #000 0%, #333 100%)", borderRadius: 12, padding: "24px 20px", textAlign: "center", color: "#fff" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>▲</div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Déployer sur Vercel</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Votre site en ligne en 2 minutes, gratuitement</div>
                <a
                  href="https://vercel.com/new/clone?repository-url=https://github.com/vercel/next.js/tree/canary/examples/hello-world"
                  target="_blank" rel="noreferrer"
                  style={{ display: "inline-block", background: "#fff", color: "#000", textDecoration: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 800, fontSize: 14 }}>
                  ▲ Ouvrir Vercel →
                </a>
              </div>

              <AdminSection title="📋 Guide de mise en ligne étape par étape">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { n: "1", title: "Crée un compte GitHub gratuit", desc: "Va sur github.com et crée un compte si tu n'en as pas.", link: "https://github.com", linkLabel: "Ouvrir GitHub →" },
                    { n: "2", title: "Crée un nouveau projet", desc: 'Clique sur "New repository", nomme-le cleannet-reservation, coche "Add README", puis "Create repository".', link: "https://github.com/new", linkLabel: "Créer le projet →" },
                    { n: "3", title: "Upload ton fichier", desc: 'Sur ton projet GitHub, clique "Add file" → "Upload files", puis glisse le fichier .jsx téléchargé depuis Claude.', link: null },
                    { n: "4", title: "Connecte Vercel à GitHub", desc: "Va sur vercel.com, crée un compte gratuit avec GitHub, clique \"Add New Project\" et sélectionne cleannet-reservation.", link: "https://vercel.com/new", linkLabel: "Ouvrir Vercel →" },
                    { n: "5", title: "Déploie !", desc: 'Clique "Deploy". En 2 minutes tu obtiens un lien du type cleannet-reservation.vercel.app à partager à tes clients.', link: null },
                  ].map(s => (
                    <div key={s.n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{s.n}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{s.title}</div>
                        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5, marginBottom: s.link ? 6 : 0 }}>{s.desc}</div>
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noreferrer"
                            style={{ fontSize: 13, color, fontWeight: 700, textDecoration: "none" }}>{s.linkLabel}</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AdminSection>

              <AdminSection title="💡 Ton lien une fois en ligne">
                <div style={{ background: "#F7F8FC", borderRadius: 8, padding: "12px 14px", fontSize: 14, fontFamily: "monospace", color: "#374151", letterSpacing: "0.3px" }}>
                  https://cleannet-reservation.vercel.app
                </div>
                <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>Tu peux aussi connecter ton propre nom de domaine gratuitement dans les réglages Vercel.</p>
              </AdminSection>
            </div>
          )}

          {/* TAB: Password */}
          {tab === "password" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <AdminSection title="Changer le mot de passe admin">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Mot de passe actuel</label>
                  <input type="password" value={pwdCurrent} onChange={e => setPwdCurrent(e.target.value)}
                    style={inputStyle} placeholder="Entrez le mot de passe actuel" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Nouveau mot de passe</label>
                  <input type="password" value={pwdNew} onChange={e => setPwdNew(e.target.value)}
                    style={inputStyle} placeholder="Minimum 6 caractères" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Confirmer le nouveau mot de passe</label>
                  <input type="password" value={pwdConfirm} onChange={e => setPwdConfirm(e.target.value)}
                    style={inputStyle} placeholder="Répétez le nouveau mot de passe" />
                </div>
                {pwdMsg && (
                  <div style={{ background: pwdMsg.ok ? "#F0FDF4" : "#FEF2F2", border: `1.5px solid ${pwdMsg.ok ? "#059669" : "#DC2626"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: pwdMsg.ok ? "#059669" : "#DC2626", fontWeight: 600 }}>
                    {pwdMsg.ok ? "✓ " : "✕ "}{pwdMsg.text}
                  </div>
                )}
                <button onClick={() => {
                  if (pwdCurrent !== getPassword()) { setPwdMsg({ ok: false, text: "Mot de passe actuel incorrect" }); return; }
                  if (pwdNew.length < 6) { setPwdMsg({ ok: false, text: "Le nouveau mot de passe doit faire au moins 6 caractères" }); return; }
                  if (pwdNew !== pwdConfirm) { setPwdMsg({ ok: false, text: "Les deux mots de passe ne correspondent pas" }); return; }
                  setPassword(pwdNew);
                  setPwdCurrent(""); setPwdNew(""); setPwdConfirm("");
                  setPwdMsg({ ok: true, text: "Mot de passe modifié avec succès !" });
                  setTimeout(() => setPwdMsg(null), 3000);
                }} style={{ background: color, color: "#fff", border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Changer le mot de passe
                </button>
              </AdminSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
function AdminLogin({ onSuccess, onClose }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);
  const check = () => {
    if (pwd === getPassword()) { onSuccess(); }
    else { setErr(true); setTimeout(() => setErr(false), 2000); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 320, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>🔐</div>
        <h2 style={{ fontWeight: 800, fontSize: 18, textAlign: "center", margin: "0 0 4px" }}>Accès administration</h2>
        <p style={{ fontSize: 13, color: "#6B7280", textAlign: "center", margin: "0 0 20px" }}>Entrez le mot de passe admin</p>
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} onKeyDown={e => e.key === "Enter" && check()}
          placeholder="Mot de passe" style={{ ...inputStyle, marginBottom: 10 }} autoFocus />
        {err && <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 8px" }}>Mot de passe incorrect</p>}
        <button onClick={check}
          style={{ width: "100%", background: "#0057FF", color: "#fff", border: "none", borderRadius: 8, padding: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
          Accéder au panneau
        </button>
        <button onClick={onClose}
          style={{ width: "100%", background: "#F3F4F6", border: "none", borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#374151" }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── SMALL UI HELPERS ─────────────────────────────────────────────────────────
function AdminSection({ title, children }) {
  return (
    <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px" }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}
function AdminField({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}
function Row({ label, val, bold, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
      <span style={{ color: "#6B7280" }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: color || "#1A1F36" }}>{val}</span>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const inputStyle = {
  border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 12px",
  fontSize: 14, color: "#1A1F36", outline: "none", fontFamily: "inherit",
  background: "#fff", width: "100%", boxSizing: "border-box",
};
const recapCard = {
  background: "#F7F8FC", borderRadius: 12, padding: "14px 18px", marginBottom: 14,
};
const backBtn = {
  background: "none", border: "1.5px solid #E5E7EB", borderRadius: 8,
  padding: "10px 18px", fontSize: 14, fontWeight: 600, color: "#6B7280", cursor: "pointer",
};
const nextBtn = {
  border: "none", borderRadius: 8, padding: "11px 24px",
  fontSize: 14, fontWeight: 700, marginLeft: "auto", transition: "background 0.15s",
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [config, setConfig] = useState(loadConfig);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const color = config.company.accentColor || "#0057FF";

  const handleSave = (newCfg) => { setConfig(newCfg); saveConfig(newCfg); };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FC", fontFamily: "'Inter', system-ui, sans-serif", color: "#1A1F36", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 9 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22, color, fontWeight: 900 }}>✦</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.5px" }}>{config.company.name}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>{config.company.tagline}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: color + "15", color, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
              Réservation en ligne
            </span>
            <button onClick={() => setShowLogin(true)}
              style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", color: "#6B7280", fontWeight: 600 }}>
              ⚙️ Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: "24px 16px 48px", maxWidth: 720, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          <BookingFlow config={config} />
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "18px 20px", textAlign: "center", fontSize: 12, color: "#9CA3AF", borderTop: "1px solid #E5E7EB" }}>
        © 2026 {config.company.name} · {config.company.zone} · {config.company.phone}
      </footer>

      {/* Modals */}
      {showLogin && !showAdmin && (
        <AdminLogin
          onSuccess={() => { setShowLogin(false); setShowAdmin(true); }}
          onClose={() => setShowLogin(false)}
        />
      )}
      {showAdmin && (
        <AdminPanel config={config} onSave={handleSave} onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}
