const dotenv = require('dotenv').config({ path: __dirname + '/../../../../.env' });
const { createDatabaseManager } = require('../../../db/create-Database-Manager');
const testData = require('../example-db-data.json');

async function resetPostgreSQL() {
    console.log("Resetting the PostgreSQL Database");
    
    try {
        const dbManager = createDatabaseManager('postgresql');
        
        await dbManager.resetDatabase(testData);
        
        console.log("PostgreSQL database reset successfully!");
        
        await dbManager.disconnect();
        
    } catch (error) {
        console.error("Error resetting PostgreSQL database:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    resetPostgreSQL();
}

module.exports = resetPostgreSQL;