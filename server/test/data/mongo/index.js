const dotenv = require('dotenv').config({ path: __dirname + '/../../../.env' });
const { createDatabaseManager } = require('../../../db');
const testData = require('../example-db-data.json');

async function resetMongo() {
    try {
        const dbManager = createDatabaseManager('mongodb');
        await dbManager.connect();

        await dbManager.resetDatabase(testData);

        console.log("MongoDB database successfully reset!");
    } catch (error) {
        console.error("Error resetting the MongoDB database:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    resetMongo();
}

module.exports = resetMongo;

