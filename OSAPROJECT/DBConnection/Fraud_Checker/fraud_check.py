#to run it : uvicorn fraud_check:app --reload --port 5000
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import bcrypt
from pymongo import MongoClient
from datetime import datetime, timedelta
import jwt  # For token generation
import os
from fastapi.encoders import jsonable_encoder
from bson.objectid import ObjectId
from pydantic import BaseModel

app = FastAPI()

# CORS for frontend-backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
client = MongoClient("mongodb://localhost:27017")
db = client["supply_chain_blockchain"]
users_collection = db["users"]
transactions_collection = db["transactions"]  # Added collection for transactions
products_collection = db["products"]  # Add this missing line

SECRET_KEY = "your_secret_key"  # Use a strong secret key

# Pydantic models for the user, password reset request, and transaction data
class User(BaseModel):
    email: str
    password: str

class PasswordResetRequest(BaseModel):
    email: str

class TransactionData(BaseModel):
    productId: str
    quantity: int
    price: float
    sender: str
    receiver: str

class Product(BaseModel):
    productId: str
    name: str
    max_quantity: int
    max_price: float

# Generate JWT token for password reset link
def create_reset_token(email: str):
    expiration_time = datetime.utcnow() + timedelta(hours=1)
    token = jwt.encode({"email": email, "exp": expiration_time}, SECRET_KEY, algorithm="HS256")
    return token

@app.post("/register")
async def register(user: User):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    result = users_collection.insert_one({
        "email": user.email,
        "password": hashed_password
    })
    return {"status": "success", "user_id": str(result.inserted_id)}

@app.post("/login")
async def login(user: User):
    existing_user = users_collection.find_one({"email": user.email})
    if not existing_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not bcrypt.checkpw(user.password.encode('utf-8'), existing_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    return {"status": "success", "message": "Logged in successfully", "user_id": str(existing_user["_id"])}

@app.post("/forgot-password")
async def forgot_password(data: PasswordResetRequest):
    user = users_collection.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    # Generate reset token
    token = create_reset_token(data.email)

    # Here you should send the email with the reset link
    # The link would look like: http://localhost:3000/reset-password?token=<token>
    reset_link = f"http://localhost:3000/reset-password?token={token}"

    # Send email with reset_link (use SendGrid, SMTP, etc.)
    print(f"Password reset link: {reset_link}")  # Placeholder for email sending logic

    return {"message": "Password reset link sent to your email"}

@app.get("/reset-password")
async def reset_password(token: str, new_password: str):
    try:
        # Decode token to get email
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = decoded_token["email"]

        # Find user in DB
        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Hash the new password
        hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())

        # Update password in DB
        users_collection.update_one({"email": email}, {"$set": {"password": hashed_password}})

        return {"message": "Password successfully reset"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Reset token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
@app.get("/transactions")
async def get_transactions():
    try:
        # Fetch transactions sorted by timestamp (most recent first)
        transactions = list(transactions_collection.find().sort("timestamp", -1))
        
        # Format each transaction
        for tx in transactions:
            tx["_id"] = str(tx["_id"])  # Convert ObjectId to string
            if isinstance(tx.get("timestamp"), datetime):
                tx["timestamp"] = tx["timestamp"].isoformat()  # Format datetime as ISO string
            else:
                tx["timestamp"] = str(tx.get("timestamp", ""))  # Fallback to string
        
        print("Transactions fetched successfully:", transactions)  # Debugging log
        return jsonable_encoder(transactions)
    except Exception as e:
        print("Error fetching transactions:", e)  # Log the error
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")
    
@app.get("/api/transactions/count")
async def get_transaction_count():
    try:
        count = transactions_collection.count_documents({})
        return {"count": count}
    except Exception as e:
        print("Error fetching transaction count:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch transaction count")

@app.get("/api/products/count")
async def get_product_count():
    try:
        count = products_collection.count_documents({})
        return {"count": count}
    except Exception as e:
        print("Error fetching product count:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch product count")

@app.get("/api/transactions/fraudulent/count")
async def get_fraudulent_transaction_count():
    try:
        count = transactions_collection.count_documents({"fraudFlag": True})
        return {"count": count}
    except Exception as e:
        print("Error fetching fraudulent transaction count:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch fraudulent transaction count")            

@app.get("/products")
async def get_products():
    try:
        # Fetch all products
        products = list(products_collection.find())
        
        # Format each product
        for p in products:
            p["_id"] = str(p["_id"])  # Convert ObjectId to string
        
        print("Products fetched successfully:", products)  # Debugging log
        return jsonable_encoder(products)
    except Exception as e:
        print("Error fetching products:", e)  # Log the error
        raise HTTPException(status_code=500, detail="Failed to fetch products")

@app.post("/products")
async def add_product(product: Product):
    # Ensure product data integrity
    if products_collection.find_one({"productId": product.productId}):
        raise HTTPException(status_code=400, detail="Product already exists")
    
    products_collection.insert_one(product.dict())
    return {"message": "Product added successfully"}

def is_transaction_fraudulent(data: TransactionData) -> bool:
    # Look up product limits from MongoDB
    product = products_collection.find_one({"productId": data.productId})
    if not product:
        return True  # If the product doesn't exist, consider it fraudulent

    # Apply max price and quantity checks
    if data.quantity > product.get("max_quantity", float('inf')):
        return True
    if data.price > product.get("max_price", float('inf')):
        return True
    if data.sender == data.receiver:
        return True

    return False

@app.get("/api/transactions/recent")
async def get_recent_transactions(limit: int = 5):
    """
    Fetch the most recent transactions, limited by the `limit` parameter.
    """
    try:
        # Fetch transactions sorted by timestamp (most recent first)
        transactions = list(transactions_collection.find().sort("timestamp", -1).limit(limit))
        
        # Format each transaction
        for tx in transactions:
            tx["_id"] = str(tx["_id"])  # Convert ObjectId to string
            if isinstance(tx.get("timestamp"), datetime):
                tx["timestamp"] = tx["timestamp"].isoformat()  # Format datetime as ISO string
            else:
                tx["timestamp"] = str(tx.get("timestamp", ""))  # Fallback to string
        
        print("Recent transactions fetched successfully:", transactions)  # Debugging log
        return jsonable_encoder(transactions)
    except Exception as e:
        print("Error fetching recent transactions:", e)  # Log the error
        raise HTTPException(status_code=500, detail="Failed to fetch recent transactions")

@app.get("/api/products/popular")
async def get_popular_products(limit: int = 5):
    """
    Fetch the most popular products based on the number of transactions.
    """
    try:
        # Aggregate transactions to count occurrences of each productId
        pipeline = [
            {"$group": {"_id": "$productId", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},  # Sort by count in descending order
            {"$limit": limit},  # Limit the number of results
        ]
        popular_products = list(transactions_collection.aggregate(pipeline))

        # Fetch product details for each productId
        products = []
        for product in popular_products:
            product_details = products_collection.find_one({"productId": product["_id"]})
            if product_details:
                product_details["_id"] = str(product_details["_id"])  # Convert ObjectId to string
                products.append({
                    "productId": product["_id"],
                    "name": product_details.get("name", "Unknown"),
                    "transactionCount": product["count"],
                })

        print("Popular products fetched successfully:", products)  # Debugging log
        return jsonable_encoder(products)
    except Exception as e:
        print("Error fetching popular products:", e)  # Log the error
        raise HTTPException(status_code=500, detail="Failed to fetch popular products")

@app.post("/fraud-check")
async def fraud_check(data: TransactionData):
    try:
        print("Received transaction data:", data.dict())  # Debug log

        fraud_result = is_transaction_fraudulent(data)

        # Save the transaction to the database with fraud flag
        transaction_record = {
            "productId": data.productId,
            "quantity": data.quantity,
            "price": data.price,
            "sender": data.sender,
            "receiver": data.receiver,
            "fraudFlag": fraud_result,
            "timestamp": datetime.utcnow()
        }

        result = transactions_collection.insert_one(transaction_record)
        print("Transaction saved successfully:", transaction_record)  # Debugging log

        return {
            "status": "success",
            "fraudulent": fraud_result,
            "transaction_id": str(result.inserted_id)
        }

    except Exception as e:
        print("Error in fraud_check endpoint:", e)
        raise HTTPException(status_code=500, detail="Failed to create transaction")
