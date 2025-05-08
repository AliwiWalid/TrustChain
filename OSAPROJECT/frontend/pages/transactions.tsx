import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import "../styles/login.css";

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
  const router = useRouter();

  useEffect(() => {
    fetch("http://localhost:5000/transactions")
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(err => console.error("Failed to fetch transactions:", err));
  }, []);
  

  return (
    <motion.div
      className="min-h-screen bg-black text-white p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Transactions</h1>
          <button
            onClick={() => router.push("/create-transaction")}
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl font-semibold"
          >
            Create New
          </button>
        </div>

        {transactions.length === 0 ? (
          <p className="text-gray-400">No transactions yet.</p>
        ) : (
          <ul className="space-y-4">
  {transactions.map((tx, index) => (
    <li
      key={index}
      className="bg-zinc-900 p-4 rounded-xl shadow-md border border-zinc-700"
    >
      <p><strong>Product ID:</strong> {tx.productId}</p>
      <p><strong>Sender:</strong> {tx.sender}</p>
      <p><strong>Receiver:</strong> {tx.receiver}</p>
      <p><strong>Quantity:</strong> {tx.quantity}</p>
      <p><strong>Price:</strong> ${tx.price}</p>
      <p><strong>Total:</strong> ${tx.quantity * tx.price}</p>
      <p><strong>Fraud:</strong> {tx.fraudFlag ? "🚨 Yes" : "✅ No"}</p>
      <p><strong>Timestamp:</strong> {new Date(tx.timestamp).toLocaleString()}</p>
    </li>
  ))}
</ul>
        )}
      </div>
    </motion.div>
  );
}
