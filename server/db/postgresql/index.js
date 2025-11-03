const DatabaseManager = require('../index');
const { Sequelize, DataTypes } = require('sequelize');

class PostgreSQLManager extends DatabaseManager {
    constructor() {
        super();
        this.sequelize = null;
        this.User = null;
        this.Playlist = null;
        this.isConnected = false;
        this.initializeModels();
    }

    initializeModels() {
        this.sequelize = new Sequelize(
            process.env.DB_NAME || 'playlister',
            process.env.DB_USER || 'postgres',
            process.env.DB_PASSWORD || 'password',
            {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                dialect: 'postgres',
                logging: false,
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            }
        );

        this.User = sequelize.define('User', {
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

        this.Playlist = sequelize.define('Playlist', {
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
    }

    async connect() {
        if (this.isConnected) {
            return;
        }

        try {
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
        console.log('PostgreSQL disconnected');
    }

    async createUser(userData) {
        return await this.User.create(userData);
    }

    async getUserById(id) {
        return await this.User.findByPk(id);
    }

    async getUserByEmail(email) {
        return await this.User.findOne({ where: { email } });
    }

    async updateUser(id, updateData) {
        const user = await this.User.findByPk(id);
        return await user.update(updateData);
    }

    async deleteUser(id) {
        const user = await this.User.findByPk(id);
        await user.destroy();
    }

    /*
    * Playlist Methods
    */
    async createPlaylist(playlistData) {
        return await this.Playlist.create(playlistData);
    }

    async getPlaylistById(id) {
        return await this.Playlist.findByPk(id);
    }

    async getPlaylistByOwnerEmail(ownerEmail) {
        return await this.Playlist.findOne({ where: { ownerEmail } });
    }

    async updatePlaylist(id, updateData) {
        const playlist = await this.Playlist.findByPk(id);

        return await playlist.update(updateData);
    }

    async deletePlaylist(id) {
        const playlist = await this.Playlist.findByPk(id);

        await playlist.destroy();
    }

    async getUserPlaylists(userId) {
        const user = await this.User.findByPk(userId, {
            include: [this.Playlist]
        });
        return user ? user.Playlists : [];
    }

    async getPlaylistPairsByOwnerEmail(ownerEmail) {
        const playlists = await this.Playlist.findAll({
            where: { ownerEmail },
            attributes: ['id', 'name']
        });

        return playlists.map(playlist => ({
            _id: playlist._id,
            name: playlist.name
        }));
    }
}

module.exports = PostgreSQLManager;