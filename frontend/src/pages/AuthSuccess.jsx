import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Save it in the "Digital Safe"
      localStorage.setItem("token", token);
      navigate("/setup"); // Or /dashboard if setup is done
    } else {
      navigate("/");
    }
  }, []);

  return <div>Logging you in...</div>;
}
