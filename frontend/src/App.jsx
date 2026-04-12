import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import OrderPlacement from "./pages/OrderPlacement";
import OrderChat from "./pages/OrderChat";
import AuthSuccess from "./pages/AuthSuccess";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - Anyone can see this */}
        <Route path="/" element={<Home />} />

        {/* NEW JWT LOGIC: This is the "Bridge" route. 
            It catches the token from the backend redirect and saves it.
        */}
        <Route path="/auth-success" element={<AuthSuccess />} />

        {/* Protected routes - These now look for the JWT in localStorage */}
        <Route path="/setup" element={<Setup />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Order Placement Route */}
        <Route path="/order-placement" element={<OrderPlacement />} />

        {/* Dedicated Chat Route */}
        <Route path="/chat/:orderId" element={<OrderChat />} />

        {/* Error Pages - Kept from previous version */}
        <Route
          path="/error"
          element={
            <div style={{ textAlign: "center", padding: "50px" }}>
              <h1>Login Failed</h1>
              <p>Check backend console for SQL errors.</p>
            </div>
          }
        />

        <Route
          path="/unauthorized"
          element={
            <h2
              style={{ textAlign: "center", color: "red", marginTop: "50px" }}
            >
              Email Not Authorized!
            </h2>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
