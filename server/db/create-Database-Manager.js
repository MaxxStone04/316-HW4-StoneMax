const DatabaseManager = require('./index');

const createDatabaseManager = (databaseType = process.env.DB_TYPE || 'mongodb') => {
    switch (databaseType.toLowerCase()) {
        case 'mongodb': 
            const MongoDBManager = require('./mongodb');
            return new MongoDBManager();
        case 'postgresql':
        case 'postgres':
            const PostgreSQLManager = require('./postgresql');
            return new PostgreSQLManager();
        default:
            throw new Error(`Unsupported Database Type: ${databaseType}`);
    }
};

module.exports = { 
    createDatabaseManager 
};