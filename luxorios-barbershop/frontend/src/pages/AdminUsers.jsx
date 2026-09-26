import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VIP.css";
import { useSite } from "../context/SiteContext";

const AdminUsers = () => {
  const { t } = useSite();
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const token = localStorage.getItem("token");
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});
  const getRole = () => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1])).role;
    } catch {
      return null;
    }
  };

  const role = getRole();

  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(res.data.data || []);
    } catch {
      setMessage(t("usersLoadError"));
    }
  };

  const toggleUserStatus = async (phonenumber, is_verified) => {
    try {
      await API.patch(
        "/admin/users/status",
        { phonenumber, is_verified: !is_verified },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.phonenumber === phonenumber
            ? { ...u, is_verified: !is_verified }
            : u
        )
      );
    } catch {
      setMessage(t("statusUpdateFailed"));
    }
  };

  // Bulk toggle all non-admin users
  const bulkToggleUsers = async (activate) => {
    try {
      const confirmMsg = activate
        ? t("activateAllConfirm")
        : t("deactivateAllConfirm");
      
      if (!window.confirm(confirmMsg)) return;

      const res = await API.patch(
        "/admin/users/bulk-toggle",
        { is_verified: activate ? 1 : 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`${t("usersUpdated")}: ${res.data.affectedRows}`);
      fetchUsers(); // Refresh the list
    } catch {
      setMessage(t("bulkUpdateFailed"));
    }
  };

  useEffect(() => {
    if (role === "admin") fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (role !== "admin") {
    return (
      <div className="main-container">
        <h2 className="vip-title">{t("unauthorized")}</h2>
      </div>
    );
  }

  // ================= WHATSAPP MESSAGE =================
  const buildWhatsAppMessage = (user) => {
    return `${t("reminderHello")} ${user.name} 👋\n\n${t("reminderBody")}`;
  };

  return (
    <div className="main-container">

      <div className="vip-card">

      <div className="section-heading">
        <h2 className="section-eyebrow">{t("users")}</h2>
        <p>{t("usersIntro")}</p>
      </div>

      {/* ================= BULK ACTIONS ================= */}
      <div className="bulk-actions">
        <button
          className="vip-button action-success"
          onClick={() => bulkToggleUsers(true)}
        >
          {t("activateAll")}
        </button>
        <button
          className="vip-button action-danger"
          onClick={() => bulkToggleUsers(false)}
        >
          {t("deactivateAll")}
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div
        className="table-wrapper"
        style={{ maxHeight: "520px", overflowY: "auto" }}
      >

      {message && (
        <p style={{ textAlign: "center", color: "red" }}>{message}</p>
      )}
        <table className="custom-table">

          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("status")}</th>
              <th>{t("action")}</th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 10 }).map((_, i) => {
              const u = users[i];

              return (
                <tr
                  key={i}
                  className="table-row"
                  onClick={() => u && setSelectedUser(u)}
                  style={{ cursor: u ? "pointer" : "default" }}
                >
                  <td>{u ? u.name : "-"}</td>

                  <td>
                    {u
                      ? u.is_verified
                        ? t("active")
                        : t("pending")
                      : "-"}
                  </td>

                  <td>
                    {u ? (
                      <button
                        className="vip-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUserStatus(
                            u.phonenumber,
                            u.is_verified
                          );
                        }}
                      >
                        {u.is_verified
                          ? t("deactivate")
                          : t("activate")}
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>
      </div>

      {/* ================= MODAL ================= */}
      {selectedUser && (
        <div
          className="popup-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="popup-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {selectedUser.name}
            </h3>

            <p>
              {selectedUser.phonenumber}
            </p>

            <a
              href={`tel:${selectedUser.phonenumber}`}
              className="vip-button"
            >
              {t("call")}
            </a>

            <a
              href={`https://wa.me/${selectedUser.phonenumber}?text=${encodeURIComponent(
                buildWhatsAppMessage(selectedUser)
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="vip-button"
            >
              {t("whatsapp")}
            </a>

            <button
              className="vip-button"
              style={{ marginTop: "2px" }}
              onClick={() => setSelectedUser(null)}
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}
</div>
    </div>
  );
};

export default AdminUsers;
