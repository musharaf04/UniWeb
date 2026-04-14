import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

// ── tiny reusable helpers ──────────────────────────────────────────────────
const Modal = ({ children, zIndex = 5000 }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex,
      backgroundColor: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}
  >
    {children}
  </div>
);

const Card = ({ children, style = {} }) => (
  <div
    style={{
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      border: "1px solid #e5e7eb",
      padding: "20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Btn = ({
  children,
  onClick,
  disabled,
  variant = "primary",
  style = {},
}) => {
  const base = {
    padding: "11px 18px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "600",
    fontSize: "14px",
    cursor: disabled ? "default" : "pointer",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    transition: "background-color 0.15s",
    ...style,
  };
  const variants = {
    primary: {
      backgroundColor: disabled ? "#e5e7eb" : "#111827",
      color: disabled ? "#9ca3af" : "#fff",
    },
    secondary: {
      backgroundColor: "#f1f5f9",
      color: "#374151",
      border: "1px solid #e2e8f0",
    },
    danger: {
      backgroundColor: "#fef2f2",
      color: "#dc2626",
      border: "1px solid #fecaca",
    },
    green: {
      backgroundColor: disabled ? "#e5e7eb" : "#16a34a",
      color: disabled ? "#9ca3af" : "#fff",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant] }}
    >
      {children}
    </button>
  );
};
// ──────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token"); // 🔑 Get JWT from storage

  const [userData, setUserData] = useState(null);
  const [availableOrders, setAvailable] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [activeChat, setActiveChat] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // modals
  const [showSidebar, setShowSidebar] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [proposeModal, setProposeModal] = useState(null); // order object
  const [showOtp, setShowOtp] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [proposeDetails, setProposeDetails] = useState({
    location: "",
    etaVal: "",
    etaUnit: "minutes",
  });

  const chatEndRef = useRef(null);
  const prevHandshakeRef = useRef(null);
  const prevActiveRef = useRef(null);
  const prevChatLengthRef = useRef(0);

  // ── JWT Auth Header Helper ──
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // ── notifications ──────────────────────────────────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("rulesAccepted")) setShowRules(true);
  }, []);

  const notify = (title, body) => {
    const audio = new Audio("/alert.mp3");
    audio.play().catch(() => console.log("Audio play blocked by browser"));

    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);

    if (
      document.hidden &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(title, {
        body: body,
        icon: "https://cdn-icons-png.flaticon.com/512/2950/2950663.png",
      });
    }
  };

  // ── data fetching (Updated for JWT) ──────────────────────────────────────
  const fetchData = () => {
    if (!token) {
      navigate("/");
      return;
    }

    fetch(`${API}/api/user/me`, { headers: getAuthHeaders() })
      .then((r) => {
        if (r.status === 401) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => {
        setUserData(data);
        if (data.delivering) {
          fetch(`${API}/api/orders/available`, { headers: getAuthHeaders() })
            .then((r) => r.json())
            .then(setAvailable);
        }
        fetch(`${API}/api/orders/my-deliveries`, { headers: getAuthHeaders() })
          .then((r) => r.json())
          .then(setMyDeliveries);
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/");
      });

    fetch(`${API}/api/orders/my-orders`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then(setMyOrders);
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 4000);
    return () => clearInterval(t);
  }, []);

  // ── derived state ──────────────────────────────────────────────────────
  const orderAsCustomer = myOrders.find((o) => o.status === "ACCEPTED");
  const orderAsDeliverer = myDeliveries.find((o) => o.status === "ACCEPTED");
  const activeOrder = orderAsCustomer || orderAsDeliverer;
  const handshake = myOrders.find((o) => o.status === "APPROVAL_PENDING");

  // ── live chat (Updated for JWT) ──────────────────────────────────────────
  useEffect(() => {
    if (!activeOrder) return;
    const poll = () => {
      fetch(`${API}/api/orders/${activeOrder.id}/chat`, {
        headers: getAuthHeaders(),
      })
        .then((r) => r.json())
        .then(setActiveChat);
    };
    poll();
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [activeOrder?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

    if (activeChat.length > prevChatLengthRef.current) {
      const lastMsg = activeChat[activeChat.length - 1];

      if (
        prevChatLengthRef.current > 0 &&
        lastMsg &&
        lastMsg.email !== userData?.email
      ) {
        notify("New message", lastMsg.text);
      }
      prevChatLengthRef.current = activeChat.length;
    }
  }, [activeChat, userData]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    fetch(`${API}/api/orders/${activeOrder.id}/chat/send`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ text: chatInput }),
    }).then(() => setChatInput(""));
  };

  // ── heartbeat (Updated for JWT) ──────────────────────────────────────────
  useEffect(() => {
    if (!userData?.delivering) return;
    const pulse = () =>
      fetch(`${API}/api/user/heartbeat`, {
        method: "POST",
        headers: getAuthHeaders(),
      }).catch(() => {});
    pulse();
    const t = setInterval(pulse, 10000);
    return () => clearInterval(t);
  }, [userData?.delivering]);

  // ── notification triggers ──────────────────────────────────────────────
  useEffect(() => {
    if (handshake && !prevHandshakeRef.current)
      notify("New delivery offer", "A partner wants to pick up your order.");
    prevHandshakeRef.current = handshake;
  }, [handshake]);

  useEffect(() => {
    if (activeOrder && !prevActiveRef.current)
      notify("Delivery started", "Your order is on its way.");
    prevActiveRef.current = activeOrder;
  }, [activeOrder]);

  // ── handlers (Updated for JWT) ──────────────────────────────────────────
  const handleHandshake = (id, accept) => {
    const action = accept ? "confirm-handshake" : "reject-handshake";
    fetch(`${API}/api/orders/${action}/${id}`, {
      method: "POST",
      headers: getAuthHeaders(),
    }).then(fetchData);
  };

  const toggleDelivery = () => {
    fetch(`${API}/api/user/toggle-delivery`, {
      method: "POST",
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then(setUserData);
  };

  const handlePropose = (e) => {
    e.preventDefault();
    fetch(`${API}/api/orders/propose/${proposeModal.id}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentLocation: proposeDetails.location,
        estTime: `${proposeDetails.etaVal} ${proposeDetails.etaUnit}`,
      }),
    }).then(() => {
      setProposeModal(null);
      setProposeDetails({ location: "", etaVal: "", etaUnit: "minutes" });
      fetchData();
    });
  };

  const openOtp = () => {
    setOtpInput("");
    setOtpError("");
    setShowOtp(true);
  };

  const submitOtp = () => {
    if (otpInput.length !== 4) return;
    fetch(`${API}/api/orders/complete/${activeOrder.id}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ otp: otpInput }),
    }).then(async (res) => {
      if (res.ok) {
        setShowOtp(false);
        fetchData();
      } else {
        const d = await res.json().catch(() => ({}));
        setOtpInput("");
        setOtpError(d.error || "Incorrect code. Try again.");
      }
    });
  };

  // ── Updated Sign Out Logic ──
  const handleSignOut = () => {
    localStorage.removeItem("token"); // 🔑 Destroy the JWT
    navigate("/");
  };

  if (!userData)
    return <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }} />;

  const F = "'Segoe UI', system-ui, sans-serif";

  const completedOrders = [...myOrders, ...myDeliveries].filter(
    (o) => o.status === "COMPLETED",
  );

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", fontFamily: F }}
    >
      {/* ── Rules modal (first visit) ── */}
      {showRules && (
        <Modal zIndex={9000}>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "400px",
              width: "100%",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "18px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Community guidelines
            </h3>
            <p
              style={{ margin: "0 0 16px", fontSize: "14px", color: "#6b7280" }}
            >
              By using UniWeb you agree not to order:
            </p>
            <ul
              style={{
                margin: "0 0 16px",
                padding: "0 0 0 20px",
                fontSize: "14px",
                color: "#374151",
                lineHeight: "1.8",
              }}
            >
              <li>Cigarettes or tobacco products</li>
              <li>Alcohol or alcoholic beverages</li>
              <li>Illegal drugs or controlled substances</li>
              <li>Anything that violates campus or local rules</li>
            </ul>
            <p
              style={{ margin: "0 0 20px", fontSize: "12px", color: "#9ca3af" }}
            >
              Violations may result in account suspension.
            </p>
            <Btn
              onClick={() => {
                localStorage.setItem("rulesAccepted", "true");
                setShowRules(false);
              }}
              style={{ width: "100%" }}
            >
              I understand, continue
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Handshake modal ── */}
      {handshake && (
        <Modal zIndex={8000}>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "420px",
              width: "100%",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                backgroundColor: "#f0fdf4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                marginBottom: "16px",
              }}
            >
              🤝
            </div>
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: "18px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Delivery partner found
            </h3>
            <p
              style={{ margin: "0 0 16px", fontSize: "14px", color: "#6b7280" }}
            >
              Partner #{handshake.delivererId} wants to pick up your order.
            </p>
            <div
              style={{
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                padding: "14px 16px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                <span style={{ color: "#9ca3af" }}>Current location</span>
                <br />
                <strong>{handshake.delivererLocation}</strong>
              </div>
              <div style={{ fontSize: "13px", color: "#374151" }}>
                <span style={{ color: "#9ca3af" }}>Estimated time</span>
                <br />
                <strong>{handshake.estimatedTime}</strong>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Btn
                variant="danger"
                onClick={() => handleHandshake(handshake.id, false)}
                style={{ flex: 1 }}
              >
                Decline
              </Btn>
              <Btn
                variant="green"
                onClick={() => handleHandshake(handshake.id, true)}
                style={{ flex: 1 }}
              >
                Accept partner
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── OTP modal ── */}
      {showOtp && (
        <Modal zIndex={8000}>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "340px",
              width: "100%",
            }}
          >
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: "18px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Enter delivery code
            </h3>
            <p
              style={{ margin: "0 0 20px", fontSize: "14px", color: "#6b7280" }}
            >
              Ask the customer for their 4-digit code.
            </p>
            <input
              type="number"
              placeholder="0000"
              value={otpInput}
              autoFocus
              onChange={(e) => {
                setOtpInput(e.target.value.slice(0, 4));
                setOtpError("");
              }}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "32px",
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: "10px",
                border: `2px solid ${otpError ? "#ef4444" : "#e5e7eb"}`,
                borderRadius: "10px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: otpError ? "8px" : "16px",
                fontFamily: "monospace",
                color: "#111827",
              }}
            />
            {otpError && (
              <p
                style={{
                  color: "#dc2626",
                  fontSize: "13px",
                  margin: "0 0 16px",
                  textAlign: "center",
                }}
              >
                {otpError}
              </p>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <Btn
                variant="secondary"
                onClick={() => setShowOtp(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Btn>
              <Btn
                onClick={submitOtp}
                disabled={otpInput.length !== 4}
                style={{ flex: 1 }}
              >
                Confirm
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Propose modal ── */}
      {proposeModal && (
        <Modal>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "380px",
              width: "100%",
            }}
          >
            <h3
              style={{
                margin: "0 0 4px",
                fontSize: "18px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Accept this order
            </h3>
            <p
              style={{ margin: "0 0 20px", fontSize: "14px", color: "#6b7280" }}
            >
              Share your location and estimated arrival time.
            </p>
            <form onSubmit={handlePropose}>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Your current location
              </label>
              <input
                required
                placeholder="e.g. Library, TT ground floor"
                value={proposeDetails.location}
                onChange={(e) =>
                  setProposeDetails({
                    ...proposeDetails,
                    location: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  marginBottom: "16px",
                  boxSizing: "border-box",
                  outline: "none",
                  fontFamily: F,
                  backgroundColor: "#374151",
                  color: "#ffffff",
                }}
              />
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Estimated arrival time
              </label>
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "20px" }}
              >
                <input
                  required
                  type="number"
                  placeholder="15"
                  value={proposeDetails.etaVal}
                  onChange={(e) =>
                    setProposeDetails({
                      ...proposeDetails,
                      etaVal: e.target.value,
                    })
                  }
                  style={{
                    flex: 1,
                    padding: "11px 14px",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: F,
                    backgroundColor: "#374151",
                    color: "#ffffff",
                  }}
                />
                <select
                  value={proposeDetails.etaUnit}
                  onChange={(e) =>
                    setProposeDetails({
                      ...proposeDetails,
                      etaUnit: e.target.value,
                    })
                  }
                  style={{
                    flex: 1,
                    padding: "11px 14px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: F,
                    color: "#111827",
                    backgroundColor: "#fff",
                  }}
                >
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <Btn
                  variant="secondary"
                  onClick={() => setProposeModal(null)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Btn>
                <Btn
                  type="submit"
                  disabled={!proposeDetails.location || !proposeDetails.etaVal}
                  style={{ flex: 1 }}
                >
                  Send offer
                </Btn>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ── History modal ── */}
      {showHistory && (
        <Modal>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "460px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Order history
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  fontSize: "20px",
                }}
              >
                ✕
              </button>
            </div>
            {completedOrders.length === 0 ? (
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "14px",
                  textAlign: "center",
                  margin: "20px 0",
                }}
              >
                No completed orders yet.
              </p>
            ) : (
              completedOrders.map((o) => {
                const isMyOrder = o.user.id === userData.id;
                return (
                  <div
                    key={o.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 0",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#111827",
                        }}
                      >
                        {o.itemDescription}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                          marginTop: "2px",
                        }}
                      >
                        {isMyOrder ? "You ordered" : "You delivered"} · Order #
                        {o.id}
                      </div>
                    </div>
                    <span
                      style={{
                        fontWeight: "700",
                        fontSize: "14px",
                        color: isMyOrder ? "#dc2626" : "#16a34a",
                      }}
                    >
                      {isMyOrder ? "−10 pts" : "+10 pts"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Modal>
      )}

      {/* ── Sidebar ── */}
      {showSidebar && (
        <>
          <div
            onClick={() => setShowSidebar(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 3000,
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: "280px",
              backgroundColor: "#ffffff",
              zIndex: 4000,
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid #e5e7eb",
              boxShadow: "4px 0 20px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "28px",
              }}
            >
              <span
                style={{
                  fontWeight: "700",
                  fontSize: "16px",
                  color: "#111827",
                }}
              >
                Account
              </span>
              <button
                onClick={() => setShowSidebar(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  fontSize: "18px",
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                backgroundColor: "#111827",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "700",
                fontSize: "20px",
                marginBottom: "12px",
              }}
            >
              {userData.name.charAt(0).toUpperCase()}
            </div>
            <div
              style={{
                fontWeight: "600",
                fontSize: "16px",
                color: "#111827",
                marginBottom: "2px",
              }}
            >
              {userData.name}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#9ca3af",
                marginBottom: "4px",
              }}
            >
              {userData.email}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "24px",
              }}
            >
              ID #{userData.id}
            </div>
            <div
              style={{
                backgroundColor: "#f8f9fa",
                borderRadius: "10px",
                padding: "14px 16px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                Your points
              </span>
              <span
                style={{
                  fontWeight: "700",
                  fontSize: "18px",
                  color: "#111827",
                }}
              >
                {userData.points}
              </span>
            </div>
            <button
              onClick={() => {
                setShowHistory(true);
                setShowSidebar(false);
              }}
              style={{
                textAlign: "left",
                background: "none",
                border: "none",
                padding: "12px 0",
                borderBottom: "1px solid #f3f4f6",
                color: "#374151",
                fontWeight: "500",
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: F,
              }}
            >
              Order history
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={handleSignOut}
              style={{
                display: "block",
                padding: "12px 0",
                color: "#dc2626",
                fontWeight: "600",
                fontSize: "14px",
                border: "none",
                borderTop: "1px solid #f3f4f6",
                backgroundColor: "transparent",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: F,
              }}
            >
              Sign out
            </button>
          </div>
        </>
      )}

      {/* ── Top navbar ── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <button
          onClick={() => setShowSidebar(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "#374151",
          }}
        >
          <div
            style={{
              width: "20px",
              borderTop: "2px solid currentColor",
              marginBottom: "4px",
            }}
          />
          <div
            style={{
              width: "20px",
              borderTop: "2px solid currentColor",
              marginBottom: "4px",
            }}
          />
          <div style={{ width: "14px", borderTop: "2px solid currentColor" }} />
        </button>
        <span
          style={{
            fontWeight: "700",
            fontSize: "17px",
            color: "#111827",
            letterSpacing: "-0.3px",
          }}
        >
          Campus Express
        </span>
        <div
          style={{
            backgroundColor: "#f1f5f9",
            color: "#475569",
            padding: "6px 12px",
            borderRadius: "20px",
            fontWeight: "700",
            fontSize: "13px",
          }}
        >
          {userData.points} pts
        </div>
      </div>

      <div
        style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px" }}
      >
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{
              margin: "0 0 2px",
              fontSize: "20px",
              fontWeight: "700",
              color: "#111827",
            }}
          >
            Hello, {userData.name.split(" ")[0]}
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#9ca3af" }}>
            {userData.gender === "Male" ? "Men's hostel" : "Women's hostel"} ·{" "}
            {userData.points} points available
          </p>
        </div>

        {activeOrder && (
          <Card style={{ marginBottom: "20px", border: "1px solid #d1fae5" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#f0fdf4",
                    color: "#166534",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: "600",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      display: "inline-block",
                    }}
                  />
                  Delivery in progress
                </div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  Order #{activeOrder.id} ·{" "}
                  {orderAsCustomer
                    ? `Partner #${activeOrder.delivererId}`
                    : `Customer #${activeOrder.user.id}`}
                </div>
              </div>
              {orderAsCustomer && (
                <div
                  style={{
                    textAlign: "center",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#9ca3af",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    SHARE THIS CODE
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: "800",
                      letterSpacing: "4px",
                      color: "#111827",
                      fontFamily: "monospace",
                    }}
                  >
                    {activeOrder.deliveryOtp || "----"}
                  </div>
                </div>
              )}
            </div>
            <div
              style={{
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "16px",
                fontSize: "13px",
              }}
            >
              <div style={{ color: "#9ca3af", marginBottom: "4px" }}>
                Order details
              </div>
              <div style={{ color: "#374151", fontWeight: "500" }}>
                {activeOrder.itemDescription}
              </div>
              <div style={{ color: "#6b7280", marginTop: "4px" }}>
                {activeOrder.pickupAddress} → {activeOrder.deliveryAddress}
              </div>
            </div>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                overflow: "hidden",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid #f3f4f6",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6b7280",
                  backgroundColor: "#fafafa",
                }}
              >
                Chat with partner
              </div>
              <div
                style={{
                  height: "180px",
                  overflowY: "auto",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  backgroundColor: "#ffffff",
                }}
              >
                {activeChat.length === 0 && (
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "13px",
                      textAlign: "center",
                      margin: "20px 0",
                    }}
                  >
                    Send a message to coordinate.
                  </p>
                )}
                {activeChat.map((msg, i) => {
                  const isMe = msg.email === userData.email;
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "75%",
                          padding: "8px 12px",
                          borderRadius: isMe
                            ? "12px 12px 2px 12px"
                            : "12px 12px 12px 2px",
                          backgroundColor: isMe ? "#111827" : "#f1f5f9",
                          color: isMe ? "#fff" : "#111827",
                          fontSize: "13px",
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <form
                onSubmit={sendMessage}
                style={{
                  display: "flex",
                  gap: "8px",
                  padding: "10px",
                  borderTop: "1px solid #f3f4f6",
                  backgroundColor: "#fafafa",
                }}
              >
                <input
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    border: "none",
                    borderRadius: "20px",
                    fontSize: "13px",
                    outline: "none",
                    fontFamily: F,
                    backgroundColor: "#374151",
                    color: "#ffffff",
                  }}
                  placeholder="Message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  style={{
                    padding: "9px 16px",
                    backgroundColor: "#111827",
                    color: "#fff",
                    border: "none",
                    borderRadius: "20px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: F,
                  }}
                >
                  Send
                </button>
              </form>
            </div>
            {!orderAsCustomer && (
              <Btn variant="green" onClick={openOtp} style={{ width: "100%" }}>
                Mark as Delivered
              </Btn>
            )}
          </Card>
        )}

        {!activeOrder && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <button
              onClick={() => navigate("/order-placement")}
              style={{
                padding: "20px 16px",
                backgroundColor: "#111827",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: F,
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "10px" }}>🛒</div>
              <div
                style={{
                  fontWeight: "700",
                  fontSize: "15px",
                  marginBottom: "4px",
                }}
              >
                Place an order
              </div>
              <div style={{ fontSize: "12px", opacity: 0.6 }}>
                Request a delivery partner
              </div>
            </button>
            <button
              onClick={toggleDelivery}
              style={{
                padding: "20px 16px",
                backgroundColor: userData.delivering ? "#f0fdf4" : "#ffffff",
                color: userData.delivering ? "#166534" : "#374151",
                border: `1px solid ${userData.delivering ? "#bbf7d0" : "#e5e7eb"}`,
                borderRadius: "12px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: F,
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "10px" }}>
                {userData.delivering ? "🟢" : "⚪"}
              </div>
              <div
                style={{
                  fontWeight: "700",
                  fontSize: "15px",
                  marginBottom: "4px",
                }}
              >
                {userData.delivering ? "Available" : "Unavailable"}
              </div>
              <div style={{ fontSize: "12px", opacity: 0.6 }}>
                {userData.delivering
                  ? "Accepting deliveries"
                  : "Tap to go online"}
              </div>
            </button>
          </div>
        )}

        {userData.delivering && !activeOrder && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Available orders
              </h3>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                {availableOrders.length} nearby
              </span>
            </div>
            {availableOrders.length === 0 ? (
              <Card style={{ textAlign: "center", padding: "32px 20px" }}>
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>📭</div>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: "14px" }}>
                  No orders nearby right now. Check back soon.
                </p>
              </Card>
            ) : (
              availableOrders.map((o) => (
                <Card key={o.id} style={{ marginBottom: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1, marginRight: "12px" }}>
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#111827",
                          marginBottom: "4px",
                        }}
                      >
                        {o.itemDescription}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                        {o.pickupAddress} → {o.deliveryAddress}
                      </div>
                    </div>
                    {o.user.id === userData.id ? (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                          fontWeight: "500",
                          backgroundColor: "#f8f9fa",
                          padding: "6px 10px",
                          borderRadius: "6px",
                        }}
                      >
                        Your order
                      </span>
                    ) : (
                      <Btn
                        onClick={() => setProposeModal(o)}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        Accept
                      </Btn>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
