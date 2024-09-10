
const mongoose = require('mongoose');
const { sendTelegramNotification } = require('./telegram-bot');
const { Web3 } = require('web3');
require('dotenv').config();
const fs = require('fs');

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL));
const depositContractAddress = '0x00000000219ab540356cBB839Cbe05303d7705Fa'; // Beacon Deposit Contract address

const mongoUri = process.env.MONGODB_URI || "mongodb+srv://admin123:admin123@cluster0.de463.mongodb.net/ethereumTracker?retryWrites=true&w=majority";

// Define the Deposit schema
const depositSchema = new mongoose.Schema({
    blockNumber: String,
    blockTimestamp: String,
    fee: String,
    hash: String,
    pubkey: String
});

const Deposit = mongoose.model('Deposit', depositSchema);

async function initMongo() {
    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB Atlas");
    } catch (error) {
        console.error("Error connecting to MongoDB Atlas:", error);
    }
}

async function saveDepositToMongo(deposit) {
    try {
        const depositDoc = new Deposit(deposit);
        await depositDoc.save();
        console.log("Saved deposit to MongoDB:", deposit);
    } catch (error) {
        console.error("Error saving deposit to MongoDB:", error);
    }
}

async function getDepositTransactions(startBlock, endBlock) {
    try {
        const blockNumber = await web3.eth.getBlockNumber();
        const fromBlock = startBlock || (blockNumber - BigInt(1000));
        const toBlock = endBlock || 'latest';

        const depositEvents = await web3.eth.getPastLogs({
            fromBlock: fromBlock,
            toBlock: toBlock,
            address: depositContractAddress
        });

        for (const event of depositEvents) {
            const txReceipt = await web3.eth.getTransactionReceipt(event.transactionHash);
            const block = await web3.eth.getBlock(txReceipt.blockNumber);

            const deposit = {
                blockNumber: txReceipt.blockNumber.toString(),
                blockTimestamp: block.timestamp.toString(),
                fee: txReceipt.gasUsed.toString(),
                hash: event.transactionHash,
                pubkey: event.topics[1]
            };

            await saveDepositToMongo(deposit);  // Save to MongoDB

            await sendTelegramNotification(deposit);
        }
    } catch (error) {
        console.error("Error fetching deposits:", error);
    }
}

// Initialize MongoDB connection and start tracking deposits
(async () => {
    await initMongo();
    getDepositTransactions();
})();
