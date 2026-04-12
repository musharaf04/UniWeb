import { useState } from "react";
import { useNavigate } from "react-router-dom";

// This helper ensures we don't have double slashes like //api
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const API = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;

export default function Setup() {
  const navigate = useNavigate();
  const [gender, setGender] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCompleteSetup = async (e) => {
    e.preventDefault();
    if (!gender) return;

    setIsSaving(true);
    try {
      // Changed to update_gender to match your backend logs
      const response = await fetch(`${API}/api/user/update-gender`, {
        method: "POST",
        credentials: "include", // Essential for sending the session cookie
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gender }),
      });

      if (response.ok) {
        console.log("Setup successful!");
        navigate("/dashboard");
      } else if (response.status === 401 || response.status === 403) {
        console.error("Session expired or unauthorized. Please log in again.");
        alert("Session expired. Please refresh and log in again.");
      } else {
        const errorData = await response.text();
        console.error("Server error:", errorData);
        alert("Failed to save. Check console for details.");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error. Is the backend running?");
    } finally {
      setIsSaving(false);
    }
  };

  const options = [
    {
      value: "Male",
      label: "Men's Hostel",
      desc: "MH blocks — A, B, C and more",
      icon: "🏢",
    },
    {
      value: "Female",
      label: "Women's Hostel",
      desc: "GH blocks — A, B, C and more",
      icon: "🏠",
    },
  ];

  const F = "'Segoe UI', system-ui, sans-serif";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: F,
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              backgroundColor: "#111827",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "22px",
            }}
          >
            📦
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#111827",
              margin: "0 0 6px",
            }}
          >
            One last step
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            Select your hostel to see the right delivery options.
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "28px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <form onSubmit={handleCompleteSetup}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              {options.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "16px",
                    borderRadius: "10px",
                    border: `2px solid ${
                      gender === opt.value ? "#111827" : "#e5e7eb"
                    }`,
                    backgroundColor:
                      gender === opt.value ? "#f9fafb" : "#ffffff",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={gender === opt.value}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ display: "none" }}
                  />
                  <span style={{ fontSize: "24px" }}>{opt.icon}</span>
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "15px",
                        color: "#111827",
                      }}
                    >
                      {opt.label}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        marginTop: "2px",
                      }}
                    >
                      {opt.desc}
                    </div>
                  </div>
                  {gender === opt.value && (
                    <div
                      style={{
                        marginLeft: "auto",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#111827",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: "11px" }}>✓</span>
                    </div>
                  )}
                </label>
              ))}
            </div>

            <div
              style={{
                backgroundColor: "#fef9c3",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#92400e",
                lineHeight: "1.5",
              }}
            >
              ⚠️ This choice is permanent and cannot be changed later.
            </div>

            <button
              type="submit"
              disabled={!gender || isSaving}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: gender && !isSaving ? "#111827" : "#e5e7eb",
                color: gender && !isSaving ? "#ffffff" : "#9ca3af",
                border: "none",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "15px",
                cursor: gender && !isSaving ? "pointer" : "default",
                fontFamily: F,
              }}
            >
              {isSaving ? "Saving..." : "Continue to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
