const DatabaseManager = require('../index');
const mongoose = require('mongoose');
const User = require('../../models/user-model');
const Playlist = require('../../models/playlist-model');

class MongoDBManager extends DatabaseManager {
    constructor() {
        super();
        this.isConnected = false;
        this.isInitialized = false;
    }

    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.connect();
        }
    }

    async connect() {
        if (this.isConnected) {
            return;
        }

        const mongoConnect = process.env.MONGO_CONNECT || 'mongodb://127.0.0.1:27017/playlister';

        try {
            await mongoose.connect(mongoConnect, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            this.isConnected = true;
            this.isInitialized = true;
            console.log('MongoDB connected!');
        } catch (error) {
            console.log('MongoDB connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (!this.isConnected) {
            return;
        }

        await mongoose.disconnect();
        this.isConnected = false;
        this.isInitialized = false;
        console.log('MongoDB disconnected');
    }

    async clearDatabase() {
        try {
            await User.deleteMany({});
            await Playlist.deleteMany({});
            console.log('MongoDB database cleared');
        } catch(error) {
            console.error('Error clearing MongoDB Database:', error);
            throw error;
        }
    }

    async resetDatabase(testData) {
        try {
            await this.clearDatabase();

            for (let userData of testData.users) {
                await this.createUser(userData);
            }

            for (let playlistData of testData.playlists) {
                await this.createPlaylist(playlistData);
            }

            console.log('MongoDB Database successfully reset with data');
        } catch (error) {
            console.error('Error resetting MongoDB Database:', error);
            throw error;
        }
    }

    async createUser(userData) {
        await this.ensureInitialized();
        const user = new User(userData);
        return await user.save();
    }

    async getUserById(id) {
        await this.ensureInitialized();
        return await User.findById(id);
    }

    async getUserByEmail(email) {
        await this.ensureInitialized();
        return await User.findOne({ email });
    }

    async updateUser(id, updateData) {
        await this.ensureInitialized();
        return await User.findByIdAndUpdate(id, updateData, {new : true });
    }

    async deleteUser(id) {
        await this.ensureInitialized();
        return await User.findByIdAndDelete(id);
    }

    /*
    * Playlist methods 
    */
    async createPlaylist(playlistData) {
        await this.ensureInitialized();
        const playlist = new Playlist(playlistData);
        return await playlist.save();
    }

    async getPlaylistById(id) {
        await this.ensureInitialized();
        return await Playlist.findById(id);
    }

    async getPlaylistsByOwnerEmail(ownerEmail) {
        await this.ensureInitialized();
        return await Playlist.find({ ownerEmail });
    }

    async updatePlaylist(id, updateData) {
        await this.ensureInitialized();
        return await Playlist.findByIdAndUpdate(id, updateData, { new: true });
    }

    async deletePlaylist(id) {
        await this.ensureInitialized();
        return await Playlist.findByIdAndDelete(id);
    }

    async getUserPlaylists(userId) {
        await this.ensureInitialized();
        const user = await User.findById(userId).populate('playlists');
        return user ? user.playlists : [];
    }

    async getPlaylistPairsByOwnerEmail(ownerEmail) {
        await this.ensureInitialized();
        const playlists = await Playlist.find({ ownerEmail });
        return playlists.map(playlist => ({
            _id: playlist._id,
            name: playlist.name
        }));
    }
}

module.exports = MongoDBManager;