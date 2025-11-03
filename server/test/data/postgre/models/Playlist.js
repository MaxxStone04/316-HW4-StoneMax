const { DataTypes } = require('sequelize')
const sequelize = require('../config/database');

const Playlist = sequelize.define('Playlist', {
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

module.exports = Playlist;