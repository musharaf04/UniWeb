import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import OrderPlacement from "./pages/OrderPlacement";
import OrderChat from "./pages/OrderChat"; // <-- Added this import!

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - Anyone can see this */}
        <Route path="/" element={<Home />} />

        {/* Protected routes - They land here after Google Login */}
        <Route path="/setup" element={<Setup />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Order Placement Route */}
        <Route path="/order-placement" element={<OrderPlacement />} />

        {/* NEW: Dedicated Chat Route */}
        <Route path="/chat/:orderId" element={<OrderChat />} />

        <Route
          path="/error"
          element={
            <div>
              <h1>Login Failed</h1>
              <p>Check backend console for SQL errors.</p>
            </div>
          }
        />

        {/* Error/Unauthorized pages */}
        <Route
          path="/unauthorized"
          element={
            <h2 style={{ textAlign: "center", color: "red" }}>
              Email Not Authorized!
            </h2>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
