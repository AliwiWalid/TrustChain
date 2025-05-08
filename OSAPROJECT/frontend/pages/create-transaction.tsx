import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import "../styles/transactions.css";

export default function CreateTransaction() {
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [fraudFlag, setFraudFlag] = useState(false);
  const [timestamp, setTimestamp] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const transaction = {
      sender,
      receiver,
      productId,
      price,
      fraudFlag,
      timestamp,
      amount: parseFloat(amount),
      description,
    };

    try {
      const res = await fetch("http://localhost:5000/fraud-check", { // Updated endpoint to match backend
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId, // Use the actual productId from the input field
          quantity: parseFloat(amount), // Ensure quantity is a number
          price: parseFloat(price), // Ensure price is a number
          sender,
          receiver,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create transaction");

      setMessage("Transaction created successfully!");
      setSender("");
      setReceiver("");
      setAmount("");
      setDescription("");
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
<motion.div
  className="transactions-page form-wrapper"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <form onSubmit={handleSubmit} className="transaction-form">
    <h1 className="form-title">Create Transaction</h1>

    {message && <p className="form-message">{message}</p>}

    <input
      type="text"
      placeholder="Sender"
      value={sender}
      onChange={(e) => setSender(e.target.value)}
      required
      className="form-input"
    />
    <input
      type="text"
      placeholder="Receiver"
      value={receiver}
      onChange={(e) => setReceiver(e.target.value)}
      required
      className="form-input"
    />
    <input
      type="number"
      placeholder="Amount"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      required
      className="form-input"
    />
    <input
      type="text"
      placeholder="Product ID"
      value={productId}
      onChange={(e) => setProductId(e.target.value)}
      className="form-input"
    />
    <input
      type="number"
      placeholder="Price"
      value={price}
      onChange={(e) => setPrice(e.target.value)}
      className="form-input"
    />
    <textarea
      placeholder="Description (optional)"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      className="form-input"
    />

    <button type="submit" className="submit-button">
      Submit Transaction
    </button>
  </form>
</motion.div>
  );
}