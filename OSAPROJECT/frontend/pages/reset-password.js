import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { token } = router.query;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`http://localhost:5000/reset-password?token=${token}&new_password=${newPassword}`, {
        method: "GET",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess("Password successfully reset!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        {error && <p className="text-red-400 mb-2">{error}</p>}
        {success && <p className="text-green-400 mb-2">{success}</p>}
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-zinc-800 border border-zinc-700 text-white"
          required
        />
        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition rounded-xl font-semibold"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}
