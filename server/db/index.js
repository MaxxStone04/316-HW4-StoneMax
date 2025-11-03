class DatabaseManager {
    constructor() {
        if (this.construct === DatabaseManager) {
            throw new Error("DatabaseManager is an abstract class, so it shouldn't be instantiated");
        }
    }

    async connect() {
        throw new Error("To be Implemented!");
    }

    async disconnect() {
        throw new Error("To be Implemented!");
    }

    async createUser(userData) {
        throw new Error("To be Implemented!");
    }

    async getUserById(id) {
        throw new Error("To be Implemented!");
    }

    async getUserByEmail(email) {
        throw new Error("To be Implemented!");
    }

    async updateUser(id, updateData) {
        throw new Error("To be Implemented!");
    }

    async deleteUser(id) {
        throw new Error("To be Implemented!");
    }

    async createPlaylist(playlistData) {
        throw new Error("To be Implemented!");
    }

    async getPlaylistById(id) {
        throw new Error("To be Implemented!");
    }

    async getPlaylistsByOwnerEmail(ownerEmail) {
        throw new Error("To be Implemented!");
    }

    async updatePlaylist(id, updateData) {
        throw new Error("To be Implemented!");
    }

    async deletePlaylist(id) {
        throw new Error("To be Implemented!");
    }

    async getUserPlaylists(userId) {
        throw new Error("To be Implemented!");
    }

    async getPlaylistPairsByOwnerEmail(ownerEmail) {
        throw new Error("To be Implemented!");
    }
}

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
    DatabaseManager,
    createDatabaseManager
};

