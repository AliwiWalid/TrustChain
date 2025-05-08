import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import "../styles/transactions.css"; // New CSS file

interface Transaction {
  sender: string;
  receiver: string;
  productId: string;
  quantity: number;
  price: number;
  fraudFlag: boolean;
  timestamp: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/transactions");
        if (!res.ok) throw new Error("Failed to load transactions");
        const data = await res.json();
        setTransactions(data);
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <motion.div
      className="transactions-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
     <div className="create-transaction-page">
        <div className="form-wrapper">
          <h1>Transactions</h1>
          <button onClick={() => router.push("/create-transaction")}>
            Create New
          </button>
        </div> 

        {loading ? (
          <p className="status-text">Loading transactions...</p>
        ) : error ? (
          <p className="status-text error">{error}</p>
        ) : transactions.length === 0 ? (
          <p className="status-text">No transactions yet.</p>
        ) : (
          <ul className="transaction-list">
            {transactions.map((tx, index) => (
              <li className="transaction-card" key={index}>
                <div className="card-row">
                  <span>📦 <strong>Product ID:</strong> {tx.productId}</span>
                  <span><strong>{tx.fraudFlag ? "🚨 Fraudulent" : "✅ Valid"}</strong></span>
                </div>
                <div className="card-row"><strong>Sender:</strong> {tx.sender}</div>
                <div className="card-row"><strong>Receiver:</strong> {tx.receiver}</div>
                <div className="card-row"><strong>Quantity:</strong> {tx.quantity}</div>
                <div className="card-row"><strong>Price:</strong> ${tx.price}</div>
                <div className="card-row"><strong>Total:</strong> ${tx.quantity * tx.price}</div>
                <div className="card-row"><strong>Timestamp:</strong> {new Date(tx.timestamp).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
