import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import "../styles/login.css";

export default function Login() {
  const [mode, setMode] = useState<"welcome" | "login" | "signup">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent, endpoint: string) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`http://localhost:5000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `${endpoint} failed`);

      if (endpoint === "login") {
        const user = { id: data.user_id, email };
        localStorage.setItem("user", JSON.stringify(user));
        router.push("/dashboard");
      } else {
        setMode("login");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <AnimatePresence mode="wait">
        {mode === "welcome" && (
          <motion.div
            key="welcome"
            className="card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "linear" }}
          >
            <h1 className="title">Welcome to <span className="trustchain">TrustChain</span></h1>
            <div className="button-group">
              <button onClick={() => setMode("login")}>Log In</button>
              <button onClick={() => setMode("signup")}>Sign Up</button>
            </div>
          </motion.div>
        )}

        {(mode === "login" || mode === "signup") && (
          <motion.form
            key={mode}
            className="card form-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "linear" }}
            onSubmit={(e) => handleSubmit(e, mode)}
          >
            <h2>{mode === "login" ? "Log In" : "Sign Up"}</h2>

            {error && <p className="error">{error}</p>}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">{mode === "login" ? "Log In" : "Sign Up"}</button>

            <div className="form-footer">
              {mode === "login" ? (
                <>
                  <p>
                    Don’t have an account?{" "}
                    <span className="link" onClick={() => setMode("signup")}>
                      Sign Up
                    </span>
                  </p>
                  <p>
                    <span className="link" onClick={() => router.push("/forgot-password")}>
                      Forgot Password?
                    </span>
                  </p>
                </>
              ) : (
                <p>
                  Already have an account?{" "}
                  <span className="link" onClick={() => setMode("login")}>
                    Log In
                  </span>
                </p>
              )}
              <p>
                <span className="link back-button" onClick={() => setMode("welcome")}>
                  ⬅ Back
                </span>
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
