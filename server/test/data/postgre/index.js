const dotenv = require('dotenv').config({ path: __dirname + '/../../../../.env' });
const sequelize = require('./config/database');
const User = require('./models/User');
const Playlist = require('./models/Playlist');
const testData = require('../../data/example-db-data.json');

async function clearDatabase() {

    try {
        await Playlist.drop({ cascade: true });
        await User.drop({ cascade: true });

        console.log("PostgreSQL tables cleared successfully!");
    } catch (err) {
        console.log("Note: Tables might not exist yet, creating them...");
    }
}

async function clearTables() {
    try {
        await User.sync({ force: false });
        await Playlist.sync({ force: false });
        console.log("PostgreSQL tables created successfully!");
    } catch (err) {
        console.log("Error creating tables:", err);
        throw err;
    }
}

async function fillDatabase() {
    try {
        for (let userData of testData.users) {
            await User.create({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                passwordHash: userData.passwordHash,
            });
        }
        console.log("Users created");

        for (let playlistData of testData.playlists) {
            await Playlist.create({
                name: playlistData.name,
                ownerEmail: playlistData.ownerEmail,
                songs: playlistData.songs
            });
        }
        console.log("Playlists created");
    } catch (err) {
        console.log("Error filling database:", err);
        throw err;
    }
}

async function resetPostgreSQL() {
    console.log("Resetting the PostgreSQL Database!");
    try {

        await sequelize.authenticate();
        console.log("PostgreSQL connection established.");

        await clearDatabase();
        await clearTables();
        await fillDatabase();

        console.log("Database reset successfully!");

    } catch (error) {
        console.error("Error resetting PostgreSQL database:", error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    resetPostgreSQL();
}

module.exports = resetPostgreSQL;

