use mongodb::{bson::doc, options::ClientOptions, Client, Database};
use serde::{Deserialize, Serialize};
use futures::stream::StreamExt; // Import StreamExt for cursor stream handling
use std::error::Error;

// Define a struct for Transaction
#[derive(Debug, Serialize, Deserialize)]
pub struct Transaction {
    pub product_id: String,
    pub sender: String,
    pub receiver: String,
    pub timestamp: String,
    pub status: String,
}

/// Connects to MongoDB and returns the database handle
pub async fn connect_to_db() -> Result<Database, Box<dyn Error>> {
    let db_uri = "mongodb://localhost:27017";
    let client_options = ClientOptions::parse(db_uri).await?;
    let client = Client::with_options(client_options)?;
    let db = client.database("supply_chain_blockchain");
    Ok(db)
}

/// Insert a new transaction into the MongoDB database
pub async fn insert_transaction(db: &Database, transaction: &Transaction) -> Result<(), Box<dyn Error>> {
    let collection = db.collection("transactions");

    // Create the document to insert
    let doc = doc! {
        "product_id": &transaction.product_id,
        "sender": &transaction.sender,
        "receiver": &transaction.receiver,
        "timestamp": &transaction.timestamp,
        "status": &transaction.status,
    };

    // Insert the document into the collection
    collection.insert_one(doc, None).await?;
    Ok(())
}

/// Query all transactions
pub async fn get_all_transactions(db: &Database) -> Result<Vec<Transaction>, Box<dyn Error>> {
    let collection = db.collection::<Transaction>("transactions");

    // Find all documents in the collection
    let mut cursor = collection.find(None, None).await?;

    // Collect transactions from the cursor stream
    let mut transactions = Vec::new();
    while let Some(result) = cursor.next().await {
        match result {
            Ok(transaction) => transactions.push(transaction),
            Err(e) => return Err(Box::new(e)),
        }
    }

    Ok(transactions)
}
