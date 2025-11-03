const dotenv = require('dotenv').config({ path: __dirname + '/../../../../.env' });
const { createDatabaseManager } = require('../../../db/create-Database-Manager');
const testData = require('../example-db-data.json');

async function resetPostgreSQL() {
    try {
        const dbManager = createDatabaseManager('postgresql');
        await dbManager.connect();

       await dbManager.resetDatabase(testData);
       console.log("PostgreSQL Database successfully reset!");
    } catch(error) {
        console.error("Error resetting PostgreSQL Database:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    resetPostgreSQL();
}

module.exports = resetPostgreSQL;

