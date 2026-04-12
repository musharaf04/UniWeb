import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const target = searchParams.get("redirect") || "/dashboard";

    if (token) {
      console.log("Saving passport...");
      localStorage.setItem("token", token);

      // Small timeout ensures the browser has written the data
      // before Dashboard tries to read it.
      setTimeout(() => {
        navigate(target);
      }, 100);
    } else {
      navigate("/");
    }
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p>Securing your session...</p>
      </div>
    </div>
  );
}
