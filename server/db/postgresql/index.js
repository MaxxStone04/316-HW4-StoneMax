const DatabaseManager = require('../index');
const { Sequelize, DataTypes } = require('sequelize');

class PostgreSQLManager extends DatabaseManager {
    constructor() {
        super();
        this.sequelize = null;
        this.User = null;
        this.Playlist = null;
        this.isConnected = false;
    }

    async initializeModels() {
        require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

        const connectionUri = `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'playlister'}`;

        this.sequelize = new Sequelize(connectionUri, {
            dialect: 'postgres',
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        });


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
        console.log('PostgreSQL disconnected');
    }

    async clearDatabase() {
        try {
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
        return user;
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

    async getPlaylistsByOwnerEmail(ownerEmail) {
        return await this.Playlist.findAll({ where: { ownerEmail } });
    }

    async updatePlaylist(id, updateData) {
        const playlist = await this.Playlist.findByPk(id);

        return await playlist.update(updateData);
    }

    async deletePlaylist(id) {
        const playlist = await this.Playlist.findByPk(id);

        await playlist.destroy();
        return playlist;
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
            _id: playlist.id,
            name: playlist.name
        }));
    }
}

module.exports = PostgreSQLManager;