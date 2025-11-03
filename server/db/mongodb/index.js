const DatabaseManager = require('../index');
const mongoose = require('mongoose');
const User = require('../../models/user-model');
const Playlist = require('../../models/playlist-model');

class MongoDBManager extends DatabaseManager {
    constructor() {
        super();
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) {
            return;
        }

        try {
            await mongoose.connect(process.env.MONGO_CONNECT, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            this.isConnected = true;
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
        const user = new User(userData);
        return await user.save();
    }

    async getUserById(id) {
        return await User.findById(id);
    }

    async getUserByEmail(email) {
        return await User.findOne({ email });
    }

    async updateUser(id, updateData) {
        return await User.findByIdAndUpdate(id, updateData, {new : true });
    }

    async deleteUser(id) {
        return await User.findByIdAndDelete(id);
    }

    /*
    * Playlist methods 
    */
    async createPlaylist(playlistData) {
        const playlist = new Playlist(playlistData);
        return await playlist.save();
    }

    async getPlaylistById(id) {
        return await Playlist.findById(id);
    }

    async getPlaylistsByOwnerEmail(ownerEmail) {
        return await Playlist.find({ ownerEmail });
    }

    async updatePlaylist(id, updateData) {
        return await Playlist.findByIdAndUpdate(id, updateData, { new: true });
    }

    async deletePlaylist(id) {
        return await Playlist.findByIdAndDelete(id);
    }

    async getUserPlaylists(userId) {
        const user = await User.findById(userId).populate('playlists');
        return user ? user.playlists : [];
    }

    async getPlaylistPairsByOwnerEmail(ownerEmail) {
        const playlists = await Playlist.find({ ownerEmail });
        return playlists.map(playlist => ({
            _id: playlist._id,
            name: playlist.name
        }));
    }
}

module.exports = MongoDBManager;