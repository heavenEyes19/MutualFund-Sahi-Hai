import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Admin from "./pages/Admin"; // ✅ only once
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MutualFunds from "./pages/MutualFunds";
import Navbar from "./components/Navbar";

function App() {
return ( <BrowserRouter>



  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="/mutual-funds" element={<MutualFunds />} />
  </Routes>
</BrowserRouter>

);
}


export default App;
