import React from "react";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  const sectionStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginBottom: "24px",
  };

  const titleStyle = {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "16px",
  };

  const textStyle = {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: "1.6",
    marginBottom: "12px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "600",
            marginBottom: "32px",
            padding: "0",
          }}
        >
          ← Back to Home
        </button>

        <header style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "#111827",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "28px",
            }}
          >
            🏢
          </div>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "800",
              color: "#111827",
              marginBottom: "12px",
            }}
          >
            About UniWeb
          </h1>
          <p style={{ fontSize: "18px", color: "#6b7280" }}>
            A Student-Led Academic Initiative
          </p>
        </header>

        <section style={sectionStyle}>
          <h2 style={titleStyle}>What is UniWeb?</h2>
          <p style={textStyle}>
            UniWeb is a non-commercial, peer-to-peer community platform designed
            to help students help each other. It connects students who need
            something delivered on campus with student volunteers who are
            already heading that way.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={titleStyle}>Our Mission</h2>
          <p style={textStyle}>
            This project was created as part of a college initiative to foster
            community cooperation and reduce the time students spend on simple
            errands. It is 100% student-managed and operates entirely within our
            campus community.
          </p>
        </section>

        <section
          style={{
            ...sectionStyle,
            backgroundColor: "#fef2f2",
            borderColor: "#fecaca",
          }}
        >
          <h2 style={{ ...titleStyle, color: "#991b1b" }}>
            Safety & Non-Commercial Notice
          </h2>
          <p style={{ ...textStyle, color: "#991b1b" }}>
            UniWeb is **not** a professional delivery service, nor is it a commercial
            platform. It is a research and community project. We do not handle
            payments for goods, and all interactions are peer-to-peer.
          </p>
          <p style={{ ...textStyle, color: "#991b1b", fontSize: "14px" }}>
            *Automated systems: This platform is a private campus utility and
            does not impersonate any commercial services.*
          </p>
        </section>

        <footer style={{ textAlign: "center", marginTop: "40px", color: "#9ca3af" }}>
          <p style={{ fontSize: "14px" }}>
            UniWeb © 2026 · Built with ❤️ by students
          </p>
        </footer>
      </div>
    </div>
  );
}
