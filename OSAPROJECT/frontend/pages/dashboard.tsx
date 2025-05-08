import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import "../styles/dashboard.css";

interface User {
  email: string;
  id: string;
}

interface DashboardData {
  totalTransactions: number;
  productsTracked: number;
  fraudulentTransactions: number;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [transactionsResponse, productsResponse, fraudulentResponse] = await Promise.all([
          fetch("http://localhost:5000/api/transactions/count"),
          fetch("http://localhost:5000/api/products/count"),
          fetch("http://localhost:5000/api/transactions/fraudulent/count"),
        ]);

        if (!transactionsResponse.ok || !productsResponse.ok || !fraudulentResponse.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const [totalTransactions, productsTracked, fraudulentTransactions] = await Promise.all([
          transactionsResponse.json(),
          productsResponse.json(),
          fraudulentResponse.json(),
        ]);

        setDashboardData({
          totalTransactions: totalTransactions.count,
          productsTracked: productsTracked.count,
          fraudulentTransactions: fraudulentTransactions.count,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setDashboardData({
          totalTransactions: 0,
          productsTracked: 0,
          fraudulentTransactions: 0,
        });
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/transactions/recent");
        if (!res.ok) throw new Error("Failed to fetch recent transactions");
        const data = await res.json();
        setRecentTransactions(data);
      } catch (error) {
        console.error("Error fetching recent transactions:", error);
      }
    };

    fetchRecentTransactions();
  }, []);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/products/popular");
        if (!res.ok) throw new Error("Failed to fetch popular products");
        const data = await res.json();
        setPopularProducts(data);
      } catch (error) {
        console.error("Error fetching popular products:", error);
      }
    };

    fetchPopularProducts();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser || storedUser === "undefined") {
      localStorage.removeItem("user");
      router.push("/login");
      return;
    }

    try {
      const parsedUser: User = JSON.parse(storedUser);
      if (!parsedUser?.id) throw new Error("Invalid user object");
      setUser(parsedUser);
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <motion.div className="min-h-screen bg-black text-white flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "w-64" : "w-16"}`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
          <Menu />
        </button>

        {sidebarOpen && (
          <>
            <button onClick={() => router.push("/create-transaction")}>Create Transaction</button>
            <button onClick={() => router.push("/view-transactions")}>View Transactions</button>
            <button onClick={() => router.push("/products")}>Manage Products</button>

            {/* System Status */}
            <div className="system-status-box" style={{ marginTop: "auto", marginBottom: "-500px" }}>
              <div className="status-indicator">
                <span className="status-light green"></span>
                <span style={{ color: "red" }}>Backend API</span>
              </div>
              <div className="status-indicator">
                <span className="status-light green"></span>
                <span style={{ color: "red" }}>Database</span>
              </div>
              <div className="status-indicator">
                <span className="status-light green"></span>
                <span style={{ color: "red" }}>Fraud Detection</span>
            </div>
          </div>

            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1>Blockchain for Fraud Prevention in Supply Chain</h1>

        <div className="dashboard-cards">
          <div className="card">
            <h2>Total Transactions</h2>
            <p>{dashboardData?.totalTransactions || "Loading..."}</p>
          </div>

          <div className="card">
            <h2>Products Tracked</h2>
            <p>{dashboardData?.productsTracked || "Loading..."}</p>
          </div>

          <div className="card">
            <h2>Fraudulent Transactions</h2>
            <p>{dashboardData?.fraudulentTransactions || "Loading..."}</p>
          </div>
        </div>

        <div className="recent-transactions">
          <h2>Recent Transactions</h2>
          <ul>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <li key={tx._id}>
                  TX #{tx._id} — Product {tx.productId || "N/A"} — {tx.fraudFlag ? "Fraudulent" : "Valid"}
                </li>
              ))
            ) : (
              <li>Loading...</li>
            )}
          </ul>
          <button onClick={() => router.push("/view-transactions")}>View All Transactions</button>
        </div>

        <div className="popular-products">
          <h2>Most Popular Products</h2>
          <ul>
            {popularProducts.length > 0 ? (
              popularProducts.map((product) => (
                <li key={product.productId}>
                  {product.name} — {product.transactionCount} Transactions
                </li>
              ))
            ) : (
              <li>Loading...</li>
            )}
          </ul>
          <button onClick={() => router.push("/products")}>View All Products</button>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;


//TODO: FIX THE RECENT TRANSACTIONS BLOCK AND SYSTEM STATUS BLOCK FROM BEING GLUED TOGETHER
//TODO: FIX THE LOG IN PAGE, TRANSACTIONS PAGE, MANAGE PRODUCTS, CREATE TRANSACTIONS PAGE (MAKE IT NICER)
//TODO: FIX THE FRAD SYSTEM (ONLY DETECT FRAUD WHEN THE ID IS NOT VALID, THE SUM EXCEEDS THE MAX PRICE, OR THE QUANTITY EXCEEDS THE MAX QUANTITY)
//TODO: ADD A GO BACK BUTTON ON THE PAGES
//TODO: MAKE THE SIDEBAR COLLAPSIBLE
//TODO: CENTRE THE DESCIPTION(OPTIONAL) BOX ON THE CREATE TRANSACTION PAGE
//TODO: ADD ANIMATIONS
 