import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Admin from "./pages/Admin"; 
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MutualFunds from "./pages/MutualFunds";
import Navbar from "./components/Navbar";
import Chatbot from "./pages/Chatbot";

function App() {
return ( <BrowserRouter>


  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="/mutual-funds" element={<MutualFunds />} />
    <Route path="/chatbot" element={<Chatbot />} />
  </Routes>
</BrowserRouter>

);
}


export default App;
