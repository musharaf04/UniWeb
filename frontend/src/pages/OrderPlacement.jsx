import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function OrderPlacement() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [itemDescription, setItemDescription] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [customPickup, setCustomPickup] = useState("");
  const [dropOffBlock, setDropOffBlock] = useState("");
  const [customDropOff, setCustomDropOff] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [userGender, setUserGender] = useState("");
  const [activeDeliverers, setActiveDeliverers] = useState(0);
  const [loading, setLoading] = useState(true);

  const mensBlocks = [
    "MH-A Block",
    "MH-B Block",
    "MH-BX Block",
    "MH-C Block",
    "MH-D Block",
    "MH-DX Block",
    "MH-E Block",
    "MH-F Block",
    "MH-G Block",
    "MH-H Block",
    "MH-J Block",
    "MH-K Block",
    "MH-L Block",
    "MH-M Block",
    "MH-N Block",
    "MH-P Block",
    "MH-Q Block",
    "MH-R Block",
    "MH-S Block",
    "MH-T Block",
  ];
  const womensBlocks = [
    "GH-A Block",
    "GH-B Block",
    "GH-C Block",
    "GH-D Block",
    "GH-E Block",
    "GH-EX Block",
    "GH-F Block",
    "GH-G Block",
    "GH-H Block",
    "GH-J Block",
  ];
  const commonLocations = [
    "Amazon Parcel (Opp. SJT)",
    "Main Gate",
    "IA Gate",
    "3A Gate",
    "Main Building (MGR / MB)",
    "DC Bakery",
    "Balaji Stationery",
    "Central Library",
    "Silver Jubilee Tower (SJT)",
    "Technology Tower (TT)",
    "Pearl Research Park (PRP)",
    "Mahatma Gandhi Block (MGB)",
    "Other (type below)",
  ];

  const dropOffOptions =
    userGender === "Male"
      ? [...mensBlocks, ...commonLocations]
      : [...womensBlocks, ...commonLocations];

  const pickupOptions = [...dropOffOptions];

  useEffect(() => {
    fetch(`${API}/api/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setUserGender(d.gender);
        setLoading(false);
      })
      .catch(() => navigate("/"));

    fetch(`${API}/api/user/active-count`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setActiveDeliverers)
      .catch(() => {});
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsOrdering(true);
    setOrderError("");

    const finalPickup =
      pickupLocation === "Other (type below)" ? customPickup : pickupLocation;
    const finalDropOff =
      dropOffBlock === "Other (type below)"
        ? customDropOff
        : roomNumber
          ? `${dropOffBlock}, Room ${roomNumber}`
          : dropOffBlock;

    fetch(`${API}/api/orders/place`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        itemDescription,
        pickupAddress: finalPickup,
        deliveryAddress: finalDropOff,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not place order");
        setShowSuccessPopup(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 5000);
      })
      .catch((err) => {
        setOrderError(err.message);
        setIsOrdering(false);
      });
  };

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        Loading...
      </div>
    );

  const inp = {
    width: "100%",
    padding: "11px 14px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    color: "#111827",
    fontSize: "14px",
    marginBottom: "16px",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  };

  const lbl = {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "6px",
  };

  const stepLabel = {
    fontSize: "11px",
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "4px 0 14px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        paddingBottom: "40px",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
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
        <span style={{ fontWeight: "600", fontSize: "16px", color: "#111827" }}>
          New Delivery Request
        </span>
      </div>

      <div
        style={{ maxWidth: "520px", margin: "0 auto", padding: "24px 20px 0" }}
      >
        {/* Availability + cost row */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Modal / Notifications */}
          {showSuccessPopup && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                backgroundColor: "rgba(0,0,0,0.6)",
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
                  padding: "40px 24px",
                  width: "100%",
                  maxWidth: "340px",
                  textAlign: "center",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    backgroundColor: "#dcfce7",
                    color: "#16a34a",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    margin: "0 auto 20px",
                  }}
                >
                  ✓
                </div>
                <h3
                  style={{
                    margin: "0 0 10px",
                    fontSize: "20px",
                    color: "#111827",
                    fontWeight: "700",
                  }}
                >
                  Order placed successfully!
                </h3>
                <p
                  style={{ margin: "0", fontSize: "15px", color: "#6b7280" }}
                >
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          )}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: activeDeliverers > 0 ? "#f0fdf4" : "#fef9c3",
              color: activeDeliverers > 0 ? "#166534" : "#92400e",
              border: `1px solid ${activeDeliverers > 0 ? "#bbf7d0" : "#fde68a"}`,
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: activeDeliverers > 0 ? "#22c55e" : "#f59e0b",
                display: "inline-block",
              }}
            />
            {activeDeliverers > 0
              ? `${activeDeliverers} partner${activeDeliverers > 1 ? "s" : ""} available`
              : "No partners online"}
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#f1f5f9",
              color: "#475569",
              border: "1px solid #e2e8f0",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            Cost: 10 Points
          </div>
        </div>

        {/* Form card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={stepLabel}>Step 1 — What do you need?</div>
            <label style={lbl}>Vendor or shop name</label>
            <input
              style={inp}
              required
              placeholder="e.g. Swiggy, DC Bakery, Zepto"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
            />

            <div style={stepLabel}>Step 2 — Pickup location</div>
            <label style={lbl}>Where should the partner collect it?</label>
            <select
              style={{ ...inp, cursor: "pointer" }}
              required
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
            >
              <option value="" disabled>
                Select a location
              </option>
              {pickupOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            {pickupLocation === "Other (type below)" && (
              <input
                style={inp}
                required
                placeholder="Type the exact location"
                value={customPickup}
                onChange={(e) => setCustomPickup(e.target.value)}
              />
            )}

            <div style={stepLabel}>Step 3 — Delivery destination</div>
            <label style={lbl}>Where should it be delivered?</label>
            <select
              style={{ ...inp, cursor: "pointer" }}
              required
              value={dropOffBlock}
              onChange={(e) => setDropOffBlock(e.target.value)}
            >
              <option value="" disabled>
                Select your block
              </option>
              {dropOffOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {dropOffBlock === "Other (type below)" && (
              <input
                style={inp}
                required
                placeholder="Type the exact location"
                value={customDropOff}
                onChange={(e) => setCustomDropOff(e.target.value)}
              />
            )}

            <label style={lbl}>
              Room number{" "}
              <span style={{ color: "#9ca3af", fontWeight: "400" }}>
                (optional)
              </span>
            </label>
            <input
              style={inp}
              placeholder="e.g. 204, Near basketball court"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            />

            {orderError && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#dc2626",
                }}
              >
                {orderError}
              </div>
            )}

            <button
              type="submit"
              disabled={isOrdering}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: isOrdering ? "#e5e7eb" : "#111827",
                color: isOrdering ? "#9ca3af" : "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "15px",
                cursor: isOrdering ? "default" : "pointer",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
              }}
            >
              {isOrdering ? "Placing order..." : "Confirm Order · 10 Points"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}