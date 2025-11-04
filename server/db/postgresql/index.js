const DatabaseManager = require('../index');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

class PostgreSQLManager extends DatabaseManager {
    constructor() {
        super();
        this.sequelize = null;
        this.User = null;
        this.Playlist = null;
        this.isConnected = false;
        this.isInitialized = false;
        this.initializationPromise = null;
    }

    async initializeModels() {
        if (this.isInitialized) {
            return;
        }

        const postgresConfig = {
            database: process.env.POSTGRES_DB || 'playlister',
            username: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'password',
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            dialect: 'postgres',
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        };

        this.sequelize = new Sequelize(postgresConfig);


        this.User = this.sequelize.define('User', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            firstName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            passwordHash: {
                type: DataTypes.STRING,
                allowNull: false
            }
        }, {
            tableName: 'users',
            timestamps: true
        });

        this.Playlist = this.sequelize.define('Playlist', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            ownerEmail: {
                type: DataTypes.STRING,
                allowNull: false
            },
            songs: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: [],
            }
        }, {
            tableName: 'playlists',
            timestamps: true
        });

        this.User.hasMany(this.Playlist, { foreignKey: 'ownerEmail', sourceKey: 'email' });

        this.Playlist.belongsTo(this.User, { foreignKey: 'ownerEmail', targetKey: 'email' });

        this.isInitialized = true;
    }

    async ensureInitialized() {
        if (!this.isInitialized) {
            if (!this.initializationPromise) {
                this.initializationPromise = this.initializeModels();
            }
            await this.initializationPromise;
        }
    }

    async connect() {
        if (this.isConnected) {
            return;
        }

        try {

            await this.initializeModels();
            await this.sequelize.authenticate();
            await this.sequelize.sync();

            this.isConnected = true;
            console.log('PostgreSQL connected!');
        } catch (error) {
            console.error('PostgreSQL connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (!this.isConnected) {
            return;
        }

        await this.sequelize.close();
        this.isConnected = false;
        this.isInitialized = false;
        console.log('PostgreSQL disconnected');
    }

    async clearDatabase() {
        try {
            await this.ensureInitialized();
            await this.Playlist.destroy({ where: {} });
            await this.User.destroy({ where: {} });
            console.log('PostgreSQL Database cleared!');
        } catch (error) {
            console.error('Error clearing PostgreSQL Database:', error);
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

            console.log('PostgreSQL Database successfully reset with data');
        } catch (error) {
            console.error('Error resetting PostgreSQL Database:', error);
            throw error;
        }
    } 

    convertPlaylist(playlist) {
        if (!playlist) {
            return null;
        }

        const playlistData = playlist.dataValues ? playlist.dataValues : playlist;

        return {
            _id: playlistData.id.toString(),
            name: playlistData.name,
            ownerEmail: playlistData.ownerEmail,
            songs: playlistData.songs,
            createdAt: playlistData.createdAt,
            updatedAt: playlistData.updatedAt
        };
    }

    convertUser(user) {
        if (!user) {
            return null;
        }

        const userData = user.dataValues ? user.dataValues : user;

        return {
            _id: userData.id.toString(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            passwordHash: userData.passwordHash,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
        };
    }


    async createUser(userData) {
        await this.ensureInitialized();
        const { _id, ...translatedData } = userData;
        const user = await this.User.create(translatedData);
        return this.convertUser(user);
    }

    async getUserById(id) {
        await this.ensureInitialized();
        const userId = typeof id === 'string' ? parseInt(id) : id;
        const user = await this.User.findByPk(userId);
        return this.convertUser(user);
    }

    async getUserByEmail(email) {
        await this.ensureInitialized();
        const user = await this.User.findOne({ where: { email } });
        return this.convertUser(user);
    }

    async updateUser(id, updateData) {
        await this.ensureInitialized();
        const userId = typeof id === 'string' ? parseInt(id) : id;
        const user = await this.User.findByPk(userId);
        if (!user) {
            return null;
        }

        await user.update(updateData);

        return this.convertUser(user);
    }

    async deleteUser(id) {
        await this.ensureInitialized();
        const userId = typeof id === 'string' ? parseInt(id) : id;
        const user = await this.User.findByPk(userId);
        if (!user) {
            return null;
        }

        await user.destroy();
        return this.convertUser(user);
    }

    /*
    * Playlist Methods
    */
    async createPlaylist(playlistData) {
        await this.ensureInitialized();
        const { _id, ...translatedPlaylistData } = playlistData;
        const playlist = await this.Playlist.create(translatedPlaylistData);
        return this.convertPlaylist(playlist);
    }

    async getPlaylistById(id) {
        await this.ensureInitialized();
        const playlistId = typeof id === 'string' ? parseInt(id) : id;
        const playlist = await this.Playlist.findByPk(playlistId);
        return this.convertPlaylist(playlist);
    }

    async getPlaylistsByOwnerEmail(ownerEmail) {
        await this.ensureInitialized();
        const playlists = await this.Playlist.findAll({ where: { ownerEmail } });
        return playlists.map(playlist => this.convertPlaylist(playlist));
    }

    async updatePlaylist(id, updateData) {
        await this.ensureInitialized();
        const playlistId = typeof id === 'string' ? parseInt(id) : id;
        const playlist = await this.Playlist.findByPk(playlistId);
        if (!playlist) {
            return null;
        }
        await playlist.update(updateData);
        await playlist.reload();
        return this.convertPlaylist(playlist);
    }

    async deletePlaylist(id) {
        await this.ensureInitialized();
        const playlistId = typeof id === 'string' ? parseInt(id) : id;
        const playlist = await this.Playlist.findByPk(playlistId);
        if (!playlist) {
            return null;
        }
        await playlist.destroy();
        return this.convertPlaylist(playlist);
    }

    async getUserPlaylists(userId) {
        await this.ensureInitialized();
        const user = await this.User.findByPk(userId, {
            include: [this.Playlist]
        });
        return user ? user.Playlists.map(playlist => this.convertPlaylist(playlist)) : [];
    }

    async getPlaylistPairsByOwnerEmail(ownerEmail) {
        await this.ensureInitialized();
        try {
            const playlists = await this.Playlist.findAll({
                where: { ownerEmail },
                attributes: ['id', 'name']
            });

            return playlists.map(playlist => ({
                _id: playlist.id.toString(),
                name: playlist.name
            }));
        } catch (error) {
            console.error('Error in getPlaylistPairsByOwnerEmail:', error);
            throw error;
        }
    }
}

module.exports = PostgreSQLManager;