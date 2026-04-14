import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function OrderChat() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [userData, setUserData] = useState(null);
  const [activeChat, setActiveChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [orderDetail, setOrderDetail] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");

  const messagesEndRef = useRef(null);
  const prevChatLengthRef = useRef(0);

  useEffect(() => {
    fetch(`${API}/api/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setUserData)
      .catch(() => navigate("/"));

    fetch(`${API}/api/orders/my-orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((orders) => {
        const found = orders.find((o) => o.id === parseInt(orderId));
        if (found) setOrderDetail(found);
      });
  }, [navigate, orderId]);

  const fetchChat = () => {
    fetch(`${API}/api/orders/${orderId}/chat`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setActiveChat);
  };

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (activeChat.length > prevChatLengthRef.current) {
      if (
        prevChatLengthRef.current > 0 &&
        activeChat[activeChat.length - 1].email !== userData?.email
      ) {
        new Audio("/alert.mp3").play().catch(() => {});
      }
      prevChatLengthRef.current = activeChat.length;
    }
  }, [activeChat, userData]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    fetch(`${API}/api/orders/${orderId}/chat/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text: chatInput }),
    }).then(() => {
      setChatInput("");
      fetchChat();
    });
  };

  const handleFinish = () => {
    if (orderDetail && userData?.id === orderDetail.user.id) return;
    setOtpInput("");
    setOtpError("");
    setShowOtpModal(true);
  };

  const submitOtp = () => {
    if (otpInput.length !== 4) return;
    fetch(`${API}/api/orders/complete/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ otp: otpInput }),
    }).then(async (res) => {
      if (res.ok) {
        setShowOtpModal(false);
        navigate("/dashboard");
      } else {
        const d = await res.json().catch(() => ({}));
        setOtpInput("");
        setOtpError(d.error || "Incorrect code. Try again.");
      }
    });
  };

  if (!userData)
    return <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }} />;

  const isCustomer = orderDetail && userData.id === orderDetail.user.id;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* OTP Modal */}
      {showOtpModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9000,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              width: "100%",
              maxWidth: "340px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          >
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: "18px",
                color: "#111827",
                fontWeight: "700",
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
              <button
                onClick={() => setShowOtpModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  color: "#6b7280",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitOtp}
                disabled={otpInput.length !== 4}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor:
                    otpInput.length === 4 ? "#111827" : "#e5e7eb",
                  color: otpInput.length === 4 ? "#ffffff" : "#9ca3af",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: otpInput.length === 4 ? "pointer" : "default",
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              fontSize: "20px",
              padding: "0",
              lineHeight: 1,
            }}
          >
            ←
          </button>
          <div>
            <div
              style={{ fontWeight: "600", fontSize: "15px", color: "#111827" }}
            >
              Order #{orderId}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              {isCustomer
                ? "Your delivery is on the way"
                : "Delivering this order"}
            </div>
          </div>
        </div>

        {/* Customer sees OTP badge, deliverer sees Finish button */}
        {isCustomer ? (
          <div
            style={{
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "8px 14px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "#64748b",
                fontWeight: "600",
                marginBottom: "2px",
              }}
            >
              YOUR CODE
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
              {orderDetail?.deliveryOtp || "----"}
            </div>
          </div>
        ) : (
          <button
            onClick={handleFinish}
            style={{
              padding: "10px 18px",
              backgroundColor: "#111827",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          >
            Mark as Delivered
          </button>
        )}
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {activeChat.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "14px",
              marginTop: "40px",
            }}
          >
            No messages yet. Use this chat to coordinate the delivery.
          </div>
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
                  maxWidth: "72%",
                  padding: "10px 14px",
                  borderRadius: isMe
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                  backgroundColor: isMe ? "#111827" : "#ffffff",
                  color: isMe ? "#ffffff" : "#111827",
                  fontSize: "14px",
                  lineHeight: "1.4",
                  border: isMe ? "none" : "1px solid #e5e7eb",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                {!isMe && (
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    {msg.sender}
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e5e7eb",
          padding: "12px 16px",
          flexShrink: 0,
        }}
      >
        <form onSubmit={sendMessage} style={{ display: "flex", gap: "10px" }}>
          <input
            style={{
              flex: 1,
              padding: "11px 14px",
              border: "1px solid #e5e7eb",
              borderRadius: "24px",
              fontSize: "14px",
              outline: "none",
              color: "#111827",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button
            type="submit"
            style={{
              padding: "11px 20px",
              backgroundColor: "#111827",
              color: "#ffffff",
              border: "none",
              borderRadius: "24px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}