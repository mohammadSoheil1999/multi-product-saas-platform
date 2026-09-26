// App.jsx (or router file)
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Appointments from "./pages/Appointments";
import ProtectedRoute from "./protectedRoute";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import GuestRoute from "./components/GuestRoute.jsx";
import Settings from "./pages/Settings.jsx";

function App() {
  return (
    <BrowserRouter>
    <Navbar />
      <Routes>

        {/* Public route */}
        <Route path="/" element={<GuestRoute><Home /></GuestRoute>} />
        <Route path="/SignUp" element={<GuestRoute><Home /></GuestRoute>} />
        {/* Protected routes */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <Appointments />
              

            </ProtectedRoute>
          }
        />
         <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
              

            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
          <Footer />
    </BrowserRouter>
  );
}

export default App;
