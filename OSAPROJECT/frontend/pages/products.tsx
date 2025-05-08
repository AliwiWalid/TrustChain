import { useEffect, useState, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import "../styles/products.css";

interface Product {
  productId: string;
  name: string;
  max_quantity: number;
  max_price: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<Product>({
    productId: "",
    name: "",
    max_quantity: 0,
    max_price: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState("");
  const [message, setMessage] = useState("");

  useLayoutEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:5000/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (error: any) {
      setMessage(error.message || "Something went wrong");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: name === "max_quantity" || name === "max_price" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `http://localhost:5000/products/${editingProductId}`
        : "http://localhost:5000/products";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });

      if (!res.ok) throw new Error("Failed to save product");

      setMessage(`✅ Product ${isEditing ? "updated" : "added"} successfully!`);
      setNewProduct({ productId: "", name: "", max_quantity: 0, max_price: 0 });
      setIsEditing(false);
      fetchProducts();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const handleEdit = (product: Product) => {
    setNewProduct(product);
    setEditingProductId(product.productId);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`http://localhost:5000/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      setMessage("🗑️ Product deleted successfully!");
      fetchProducts();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <motion.div
      className="products-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="product-form">
        <h2>{isEditing ? "Edit Product" : "Add Product"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="productId"
            placeholder="Product ID"
            value={newProduct.productId}
            onChange={handleChange}
            required
            disabled={isEditing}
          />
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={newProduct.name}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="max_quantity"
            placeholder="Max Quantity"
            value={newProduct.max_quantity}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="max_price"
            placeholder="Max Price"
            value={newProduct.max_price}
            onChange={handleChange}
            required
          />
          <div className="form-actions">
            <button type="submit">
              {isEditing ? "Update Product" : "Add Product"}
            </button>
            {isEditing && (
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setIsEditing(false);
                  setNewProduct({ productId: "", name: "", max_quantity: 0, max_price: 0 });
                  setEditingProductId("");
                }}  
              >
                Cancel
              </button>
            )}
          </div>

        </form>
        {message && <p className="message">{message}</p>}
      </div>

      <div className="product-list">
        <h2>Existing Products</h2>
        <ul>
          {products.map(product => (
            <li key={product.productId}>
              <div>
                <strong>{product.name}</strong> <br />
                ID: {product.productId} <br />
                Max Quantity: {product.max_quantity} <br />
                Max Price: ${product.max_price}
              </div>
              <div className="product-actions">
                <button onClick={() => handleEdit(product)}>Edit</button>
                <button onClick={() => handleDelete(product.productId)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
