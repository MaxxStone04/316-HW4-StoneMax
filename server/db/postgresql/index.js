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

    async createUser(userData) {
        await this.ensureInitialized();
        const { _id, ...translatedData } = userData;
        return await this.User.create(translatedData);
    }

    async getUserById(id) {
        await this.ensureInitialized();
        if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
            return null;
        }

        return await this.User.findByPk(id);
    }

    async getUserByEmail(email) {
        await this.ensureInitialized();
        return await this.User.findOne({ where: { email } });
    }

    async getUserByMongoId(mongoId) {
        await this.ensureInitialized();
        return null;
    }

    async updateUser(id, updateData) {
        await this.ensureInitialized();
        const user = await this.User.findByPk(id);
        if (!user) {
            return null;
        }

        return await user.update(updateData);
    }

    async deleteUser(id) {
        await this.ensureInitialized();
        const user = await this.User.findByPk(id);
        if (!user) {
            return null;
        }

        await user.destroy();
        return user;
    }

    /*
    * Playlist Methods
    */
    async createPlaylist(playlistData) {
        await this.ensureInitialized();
        const { _id, ...translatedPlaylistData } = playlistData;
        return await this.Playlist.create(translatedPlaylistData);
    }

    async getPlaylistById(id) {
        await this.ensureInitialized();
        return await this.Playlist.findByPk(id);
    }

    async getPlaylistsByOwnerEmail(ownerEmail) {
        await this.ensureInitialized();
        return await this.Playlist.findAll({ where: { ownerEmail } });
    }

    async updatePlaylist(id, updateData) {
        await this.ensureInitialized();
        const playlist = await this.Playlist.findByPk(id);
        if (!playlist) {
            return null;
        }

        return await playlist.update(updateData);
    }

    async deletePlaylist(id) {
        await this.ensureInitialized();
        const playlist = await this.Playlist.findByPk(id);
        if (!playlist) {
            return null;
        }
        
        await playlist.destroy();
        return playlist;
    }

    async getUserPlaylists(userId) {
        await this.ensureInitialized();
        const user = await this.User.findByPk(userId, {
            include: [this.Playlist]
        });
        return user ? user.Playlists : [];
    }

    async getPlaylistPairsByOwnerEmail(ownerEmail) {
        await this.ensureInitialized();
        try {
            const playlists = await this.Playlist.findAll({
                where: { ownerEmail },
                attributes: ['id', 'name']
            });

            const result = playlists.map(playlist => ({
                _id: playlist.id,
                name: playlist.name
            }));

            return result;
        } catch (error) {
            console.error('Error in getPlaylistPairsByOwnerEmail:', error);
            throw error;
        }
    }
}

module.exports = PostgreSQLManager;