import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Home.css";
import "./VIP.css";
import { useSite } from "../context/SiteContext";

const Appointments = () => {
  const { language, t } = useSite();
  const [appointments, setAppointments] = useState([]);
  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [popupMessage, setPopupMessage] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [adminName, setAdminName] = useState("");

  const [notifGranted, setNotifGranted] = useState(
    Notification.permission === "granted"
  );

  const token = localStorage.getItem("token");

  useEffect(() => {
    const syncNotificationLanguage = async () => {
      if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      await fetch(`${import.meta.env.VITE_API_URL}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscription, language }),
      });
    };

    syncNotificationLanguage().catch(() => {});
  }, [language, token]);

  const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // ================= ROLE =================
  const getRole = () => {
    try {
      return JSON.parse(atob(token.split(".")[1])).role;
    } catch {
      return null;
    }
  };

  const getAdminPhone = () => {
    try {
      return JSON.parse(atob(token.split(".")[1])).phonenumber;
    } catch {
      return null;
    }
  };

  const role = getRole();
  const isAdmin = role === "admin";
  const adminPhone = getAdminPhone();

  // ================= FETCH =================
  const fetchAppointments = async () => {
    try {
      const res = await API.get("/appointments", authHeader);
      setAppointments(res.data.data || []);
    } catch {
      setPopupMessage(t("appointmentsLoadError"));
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= DAYS =================
  useEffect(() => {
    const today = new Date();
    const generatedDays = [];

    const locale = language === "ar" ? "ar" : language === "he" ? "he" : "en";

    let i = 0;
    while (generatedDays.length < 9) {
      const d = new Date();
      d.setDate(today.getDate() + i);

      // Skip Monday (day index 1)
      if (d.getDay() === 1) {
        i++;
        continue;
      }

      let label;
      if (i === 0) label = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(0, "day");
      else if (i === 1) label = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(1, "day");
      else label = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(d);

      generatedDays.push({
        date: d,
        label,
        api: d.toISOString().slice(0, 10),
        available: null,
        total: null,
        busyness: null,
      });

      i++;
    }

    setDays(generatedDays);

    // Fetch slots for all days to calculate busyness
    generatedDays.forEach((d) => {
      fetchSlots(d.api);
    });
    // fetchSlots intentionally uses the current API/session snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // ================= SLOTS =================
  const fetchSlots = async (date) => {
    setLoadingSlots(true);
    setSlots([]);

    try {
      const res = await API.get(`/appointments/slots?date=${date}`, authHeader);
      const slotsData = res.data;
      setSlots(slotsData.slots || []);

      // Calculate busyness
      const available = slotsData.available || 0;
      const total = slotsData.total || 0;
      const percentage = total > 0 ? (available / total) * 100 : 0;

      let busyness = "blue"; // Default: most available
      if (percentage < 33) {
        busyness = "red"; // Busy
      } else if (percentage < 66) {
        busyness = "orange"; // Moderate
      }

      // Update the day's busyness
      setDays((prev) =>
        prev.map((d) =>
          d.api === date
            ? { ...d, available, total, busyness }
            : d
        )
      );
    } catch {
      setPopupMessage(t("slotsLoadError"));
    } finally {
      setLoadingSlots(false);
    }
  };

  // ================= BOOK =================
  const bookAppointment = async () => {
    if (!selectedDate || !selectedSlot) {
      setPopupMessage(t("selectDateTime"));
      return;
    }

    try {
      await API.post(
        "/appointments/book",
        {
          a_date: selectedDate.api,
          a_time: selectedSlot,
          name: isAdmin ? adminName : undefined,
        },
        authHeader
      );

      alert(t("bookedSuccess"));

      setSelectedSlot("");
      setSelectedDate(null);
      setAdminName("");
      setShowBooking(false);

      fetchAppointments();
    } catch {
      setPopupMessage(t("bookingFailed"));
    }
  };

  // ================= DELETE =================
  const deleteAppointment = async () => {
    if (!selectedAppointment) return;

    // ✅ CONFIRMATION (THIS WAS MISSING)
    const confirmDelete = window.confirm(t("deleteConfirm"));
    if (!confirmDelete) return;

    try {
      let formattedTime = selectedAppointment.a_time;

      if (formattedTime.length === 5) {
        formattedTime += ":00";
      }

      // Fix: Handle date properly whether it's a string or Date object
      let formattedDate = selectedAppointment.a_date;
      
      if (formattedDate instanceof Date) {
        // If it's a Date object, convert to YYYY-MM-DD using local time
        const year = formattedDate.getFullYear();
        const month = String(formattedDate.getMonth() + 1).padStart(2, "0");
        const day = String(formattedDate.getDate()).padStart(2, "0");
        formattedDate = `${year}-${month}-${day}`;
      } else if (typeof formattedDate === "string") {
        // If it's a string, check if it's ISO format or already YYYY-MM-DD
        if (formattedDate.includes("T")) {
          // ISO format with timezone - extract YYYY-MM-DD part only
          formattedDate = formattedDate.split("T")[0];
        }
        // Already YYYY-MM-DD, use as-is
      }
      
      console.log("Raw a_date:", selectedAppointment.a_date, "Type:", typeof selectedAppointment.a_date);
      console.log("Formatted date:", formattedDate);

      console.log("Deleting appointment:", {
        date: formattedDate,
        time: formattedTime,
        phone: selectedAppointment.phonenumber,
      });

      await API.delete("/appointments/delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          a_date: formattedDate,
          a_time: formattedTime,
          phonenumber: selectedAppointment.phonenumber,
        },
      });

      alert(t("deletedSuccess"));

      setSelectedAppointment(null);
      fetchAppointments();

    } catch (err) {
      console.log("Delete error:", err);
      console.log("Error response:", err.response?.data);
      
      // If appointment not found, refresh the list to clear stale data
      if (err.response?.status === 404) {
        alert(t("appointmentMissing"));
        setSelectedAppointment(null);
        fetchAppointments(); // Refresh to clear stale data
      } else {
        alert(t("deleteFailed"));
      }
    }
  };

  // ================= NOTIFICATIONS =================
  const enableNotifications = async () => {
    try {
      if (!("serviceWorker" in navigator)) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const reg = await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            import.meta.env.VITE_VAPID_PUBLIC_KEY
          ),
        });
      }

      await fetch(`${import.meta.env.VITE_API_URL}/push/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription: sub, language }),
      });

      setNotifGranted(true);
      alert(t("notificationsSuccess"));

    } catch (err) {
      console.log(err);
      alert(t("notificationsFailed"));
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const raw = window.atob(base64);
    return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
  }

  const formatMMDD = (dateStr) => {
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  const formatTime = (time) => (time ? time.slice(0, 5) : "-");

  const isOwnAdminBooking = (a) =>
    isAdmin && a.phonenumber === adminPhone;

  // ================= UI =================
  return (
    <div className="main-container">

      <div className="vip-card appointments-card">

        <div className="section-heading">
          <h2 className="section-eyebrow">{t("appointments")}</h2>
          <p>{t("appointmentsIntro")}</p>
        </div>

        <div className="primary-actions">
          <button
            className="vip-button"
            onClick={() => setShowBooking(true)}
          >
            <span aria-hidden="true">＋</span> {t("newBooking")}
          </button>

          {!notifGranted && (
            <button className="vip-button button-secondary" onClick={enableNotifications}>
              {t("notifications")}
            </button>
          )}
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("date")}</th>
                <th>{t("time")}</th>
              </tr>
            </thead>

            <tbody>
              {appointments.map((a, i) => (
                <tr
                  key={i}
                  className="table-row"
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSelectedAppointment(a);
                  }}
                >
                  <td>{a.name}</td>
                  <td>{formatMMDD(a.a_date)}</td>
                  <td>{formatTime(a.a_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* BOOKING POPUP */}
      {showBooking && (
        <div className="popup-overlay" onClick={() => setShowBooking(false)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>

            <h3>{t("booking")}</h3>

            {popupMessage && <p style={{ color: "red" }}>{popupMessage}</p>}

            {isAdmin && (
              <input
                placeholder={t("customerName")}
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="input"
              />
            )}

            {/* Busyness Legend */}
            <div style={{ display: "flex", gap: "15px", marginBottom: "15px", justifyContent: "center", fontSize: "0.85em" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#3b82f6" }}></div>
                <span>{t("available")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#f97316" }}></div>
                <span>{t("moderate")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ef4444" }}></div>
                <span>{t("busy")}</span>
              </div>
            </div>

            <div className="days-row">
              {days.map((d, i) => {
                const busynessColor = d.busyness || "gray";
                const borderColor = busynessColor === "blue" ? "#3b82f6" 
                                  : busynessColor === "orange" ? "#f97316" 
                                  : busynessColor === "red" ? "#ef4444" 
                                  : "#666";
                
                return (
                  <button
                    key={i}
                    className={`vip-button ${
                      selectedDate?.api === d.api ? "selected" : ""
                    }`}
                    style={{
                      borderColor: borderColor,
                      borderWidth: "2px",
                      borderStyle: "solid",
                      position: "relative",
                    }}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedSlot("");
                      fetchSlots(d.api);
                    }}
                  >
                    {d.label}
                    {d.busyness && (
                      <div
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: borderColor,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="slots-grid">
              {loadingSlots ? (
                <p>{t("loading")}</p>
              ) : (
                slots.map((s, i) => (
                  <button
                    key={i}
                    className={`vip-button ${
                      selectedSlot === s ? "selected" : ""
                    }`}
                    onClick={() => setSelectedSlot(s)}
                  >
                    {formatTime(s)}
                  </button>
                ))
              )}
            </div>

            <button className="vip-button" onClick={bookAppointment}>
              {t("confirmBooking")}
            </button>

          </div>
        </div>
      )}

      {/* DETAILS POPUP */}
      {selectedAppointment && (
        <div className="popup-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>

            <h3>{t("appointmentDetails")}</h3>

            <p>{selectedAppointment.name}</p>

            {/* Admin-only: Show phone and contact buttons */}
            {isAdmin && !isOwnAdminBooking(selectedAppointment) && (
              <>
                <p>{selectedAppointment.phonenumber}</p>

                <a className="vip-button" href={`tel:${selectedAppointment.phonenumber}`}>
                  {t("call")}
                </a>

                <a
                  className="vip-button"
                  href={`https://wa.me/${selectedAppointment.phonenumber}`}
                  target="_blank"
                >
                  {t("whatsapp")}
                </a>
              </>
            )}

            {/* Admin bookings note */}
            {isOwnAdminBooking(selectedAppointment) && (
              <p style={{ color: "#888", fontSize: "0.9em" }}>
                ({t("noPhoneBooking")})
              </p>
            )}

            {/* Delete button for all users */}
            <button
              className="vip-button action-danger"
              onClick={deleteAppointment}
            >
              {t("deleteAppointment")}
            </button>

            <button
              className="vip-button"
              onClick={() => setSelectedAppointment(null)}
            >
              {t("close")}
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default Appointments;
