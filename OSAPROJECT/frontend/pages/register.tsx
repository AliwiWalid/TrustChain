import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import "../styles/login.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      setSuccess("Account created successfully. You can now log in.");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-black flex items-center justify-center text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        {error && <p className="text-red-400 mb-2">{error}</p>}
        {success && <p className="text-green-400 mb-2">{success}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-zinc-800 border border-zinc-700 text-white"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-zinc-800 border border-zinc-700 text-white"
          required
        />
        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition rounded-xl font-semibold"
        >
          Sign Up
        </button>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-4 w-full py-2 text-sm text-gray-400 hover:text-white transition"
        >
          Already have an account? Log in
        </button>
      </form>
    </motion.div>
  );
}
