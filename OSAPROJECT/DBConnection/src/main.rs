use actix_web::{web, App, HttpServer, Responder, HttpResponse};
use serde::{Deserialize, Serialize};
use db::{insert_transaction, get_all_transactions, Transaction}; // Import db functions
use mongodb::{Database, Client};
use actix_web::web::Json;
use std::sync::Arc;
use tokio::sync::Mutex;
use reqwest::Client as HttpClient;

mod db;

#[derive(Debug, Serialize, Deserialize)]
struct TransactionRequest {
    product_id: String,
    sender: String,
    receiver: String,
    timestamp: String,
    status: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct FraudCheckResponse {
    status: String, // "fraud" or "ok"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Connect to MongoDB
    let client = Client::with_uri_str("mongodb://127.0.0.1:27017")
        .await
        .expect("Failed to initialize MongoDB client");

    // Access the database
    let db = client.database("mydb");

    // Wrap the database in Arc and Mutex
    let db = web::Data::new(Arc::new(Mutex::new(db)));

    // Start the HTTP server
    HttpServer::new(move || {
        App::new()
            // Route to insert a transaction
            .route("/transactions", web::post().to(insert_transaction_handler))
            // Route to get all transactions
            .route("/transactions", web::get().to(get_all_transactions_handler))
            // Pass the db to handlers
            .app_data(db.clone())
    })
    .bind("127.0.0.1:8888")?
    .run()
    .await
}

async fn insert_transaction_handler(
    transaction: web::Json<TransactionRequest>,
    db: web::Data<Arc<Mutex<Database>>>,
) -> impl Responder {
    // Call the fraud detection service
    let fraud_status = check_fraud(&transaction).await;

    // If fraud, set status to "fraud"
    let status = if fraud_status == "fraud" {
        "fraud"
    } else {
        transaction.status.as_str()
    };

    // Create the transaction to insert into MongoDB
    let transaction = Transaction {
        product_id: transaction.product_id.clone(),
        sender: transaction.sender.clone(),
        receiver: transaction.receiver.clone(),
        timestamp: transaction.timestamp.clone(),
        status: status.to_string(),
    };

    // Insert transaction into the database
    let db = db.lock().await;  // Lock the database
    match insert_transaction(&*db, &transaction).await {
        Ok(_) => HttpResponse::Created().json(transaction),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

async fn get_all_transactions_handler(
    db: web::Data<Arc<Mutex<Database>>>,
) -> impl Responder {
    // Get all transactions from the database
    let db = db.lock().await;  // Lock the database
    match get_all_transactions(&*db).await {
        Ok(transactions) => HttpResponse::Ok().json(transactions),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

// Function to call the fraud detection service
async fn check_fraud(transaction: &TransactionRequest) -> String {
    let client = HttpClient::new();
    let url = "http://127.0.0.1:5000/verify";
    
    let body = serde_json::json!({
        "product_id": &transaction.product_id,
        "sender": &transaction.sender,
        "receiver": &transaction.receiver,
        "timestamp": &transaction.timestamp,
        "status": &transaction.status
    });

    let res = client
        .post(url)
        .json(&body)
        .send()
        .await;

    match res {
        Ok(response) => {
            if let Ok(fraud_check_response) = response.json::<FraudCheckResponse>().await {
                fraud_check_response.status
            } else {
                "ok".to_string()  // Default to "ok" in case of error
            }
        },
        Err(_) => "ok".to_string(),  // Default to "ok" in case of error
    }
}
