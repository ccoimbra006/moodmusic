import { Routes, Route } from "react-router";
import Layout from "@/components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import MoodBackground from "@/components/MoodBackground";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <>
      <MoodBackground />
      <Toaster position="bottom-center" toastOptions={{
        style: { background: "var(--bg-mid)", border: "1px solid var(--glass-border)", color: "#fff" },
      }} />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  );
}
