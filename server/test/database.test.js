import { beforeAll, beforeEach, afterEach, afterAll, expect, test } from 'vitest';
const path = require('path');

// Load environment variables from the server root
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createDatabaseManager } = require('../db/create-Database-Manager');

let dbManager;
let testUserId;
let testPlaylistId;

const testUser = {
    firstName: 'Jonathan',
    lastName: 'Bailey',
    email: 'jbailey@gmail.com',
    passwordHash: 'a28f0bab722c8e7221d5c907563bcbe2'
};

const testPlaylist = {
    name: 'Baileys Mixes',
    ownerEmail: 'jbailey@gmail.com',
    songs: [
        {
            title: 'Dancing Through Life',
            artist: 'Jonathan Bailey',
            year: 2024,
            youTubeId: 'jniq78mKKcM'
        },
        {
            title: 'In The Air Tonight',
            artist: 'Phil Collins',
            year: 1981,
            youTubeId: 'YkADj0TPrJA'
        }
    ]
};

const updatedTestPlaylist = {
    name: 'Updated Baileys Mixes',
    ownerEmail: 'jbailey@gmail.com',
    songs: [
        {
            title: 'Dancing Through Life',
            artist: 'Jonathan Bailey',
            year: 2024,
            youTubeId: 'jniq78mKKcM'
        },
        {
            title: 'Ocean Eyes',
            artist: 'Billie Eilish',
            year: 2017,
            youTubeId: 'viimfQi_pUw'
        }
    ]
};

// Helper function to compare IDs across databases
function compareIds(id1, id2) {
    // Convert both to string for comparison (handles MongoDB ObjectId and PostgreSQL numbers)
    return id1.toString() === id2.toString();
}

beforeAll(async () => {
    console.log(`Testing with database: ${process.env.DB_TYPE}`);
    dbManager = createDatabaseManager(process.env.DB_TYPE);
    await dbManager.connect();
});

beforeEach(async () => {
    // Clean up any existing test user
    try {
        const existingUser = await dbManager.getUserByEmail(testUser.email);
        if (existingUser) {
            await dbManager.deleteUser(existingUser._id || existingUser.id);
        }
    } catch (error) {
        // User might not exist, which is fine
    }
});

afterEach(async () => {
    // Clean up test data after each test
    try {
        if (testPlaylistId) {
            await dbManager.deletePlaylist(testPlaylistId);
            testPlaylistId = null;
        }
        if (testUserId) {
            await dbManager.deleteUser(testUserId);
            testUserId = null;
        }
    } catch (error) {
        // Data might already be cleaned up
    }
});

afterAll(async () => {
    await dbManager.disconnect();
});

// Test 1: Create User
test('Test 1 - Creating a User in the Database', async () => {
    const user = await dbManager.createUser(testUser);

    expect(user.firstName).toBe(testUser.firstName);
    expect(user.lastName).toBe(testUser.lastName);
    expect(user.email).toBe(testUser.email);
    expect(user.passwordHash).toBe(testUser.passwordHash);
    expect(user._id || user.id).toBeDefined();

    testUserId = user._id || user.id;
});

// Test 2: Get User by ID
test('Test 2 - Reading a User by ID from the Database', async () => {
    const createdUser = await dbManager.createUser(testUser);
    testUserId = createdUser._id || createdUser.id;

    const foundUser = await dbManager.getUserById(testUserId);

    expect(foundUser).not.toBeNull();
    expect(foundUser.firstName).toBe(testUser.firstName);
    expect(foundUser.lastName).toBe(testUser.lastName);
    expect(foundUser.email).toBe(testUser.email);
});

// Test 3: Get User by Email
test('Test 3 - Reading a User by Email from the Database', async () => {
    await dbManager.createUser(testUser);

    const foundUser = await dbManager.getUserByEmail(testUser.email);

    expect(foundUser).not.toBeNull();
    expect(foundUser.email).toBe(testUser.email);
    expect(foundUser.firstName).toBe(testUser.firstName);
});

// Test 4: Update User
test('Test 4 - Updating a User in the Database', async () => {
    const createdUser = await dbManager.createUser(testUser);
    testUserId = createdUser._id || createdUser.id;

    const updatedUserData = {
        firstName: 'Michael',
        lastName: 'Phelps'
    };

    const updatedUser = await dbManager.updateUser(testUserId, updatedUserData);

    expect(updatedUser).not.toBeNull();
    expect(updatedUser.firstName).toBe('Michael');
    expect(updatedUser.lastName).toBe('Phelps');
    expect(updatedUser.email).toBe(testUser.email);
});

// Test 5: Delete User
test('Test 5 - Deleting a User from the Database', async () => {
    const createdUser = await dbManager.createUser(testUser);
    testUserId = createdUser._id || createdUser.id;

    const deletedUser = await dbManager.deleteUser(testUserId);

    expect(deletedUser).not.toBeNull();

    const foundUser = await dbManager.getUserById(testUserId);
    expect(foundUser).toBeNull();

    testUserId = null;
});

// Test 6: Create Playlist
test('Test 6 - Creating a Playlist in the Database', async () => {
    await dbManager.createUser(testUser);

    const playlist = await dbManager.createPlaylist(testPlaylist);

    expect(playlist.name).toBe(testPlaylist.name);
    expect(playlist.ownerEmail).toBe(testPlaylist.ownerEmail);
    expect(playlist.songs).toHaveLength(2);
    expect(playlist.songs[0].title).toBe('Dancing Through Life');
    expect(playlist.songs[1].title).toBe('In The Air Tonight');
    expect(playlist._id || playlist.id).toBeDefined();

    testPlaylistId = playlist._id || playlist.id;
});

// Test 7: Get Playlist by ID
test('Test 7 - Reading a Playlist by ID from the Database', async () => {
    await dbManager.createUser(testUser);
    const createdPlaylist = await dbManager.createPlaylist(testPlaylist);
    testPlaylistId = createdPlaylist._id || createdPlaylist.id;

    const foundPlaylist = await dbManager.getPlaylistById(testPlaylistId);

    expect(foundPlaylist).not.toBeNull();
    expect(foundPlaylist.name).toBe(testPlaylist.name);
    expect(foundPlaylist.ownerEmail).toBe(testPlaylist.ownerEmail);
    expect(foundPlaylist.songs).toHaveLength(2);
});

// Test 8: Get Playlists by Owner Email
test('Test 8 - Reading Playlists by Owner Email from the Database', async () => {
    await dbManager.createUser(testUser);
    const createdPlaylist = await dbManager.createPlaylist(testPlaylist);
    testPlaylistId = createdPlaylist._id || createdPlaylist.id;

    const playlists = await dbManager.getPlaylistsByOwnerEmail(testUser.email);

    expect(Array.isArray(playlists)).toBe(true);
    expect(playlists.length).toBeGreaterThan(0);
    
    // FIX: Use helper function to compare IDs
    const foundPlaylist = playlists.find(p => 
        compareIds(p._id || p.id, testPlaylistId)
    );
    expect(foundPlaylist).not.toBeUndefined();
    expect(foundPlaylist.name).toBe(testPlaylist.name);
});

// Test 9: Update Playlist
test('Test 9 - Updating a Playlist in the Database', async () => {
    await dbManager.createUser(testUser);
    const createdPlaylist = await dbManager.createPlaylist(testPlaylist);
    testPlaylistId = createdPlaylist._id || createdPlaylist.id;

    const updatedPlaylist = await dbManager.updatePlaylist(testPlaylistId, updatedTestPlaylist);

    expect(updatedPlaylist).not.toBeNull();
    expect(updatedPlaylist.name).toBe(updatedTestPlaylist.name);
    expect(updatedPlaylist.songs).toHaveLength(2);
    expect(updatedPlaylist.songs[1].title).toBe('Ocean Eyes');
});

// Test 10: Delete Playlist
test('Test 10 - Deleting a Playlist from the Database', async () => {
    await dbManager.createUser(testUser);
    const createdPlaylist = await dbManager.createPlaylist(testPlaylist);
    testPlaylistId = createdPlaylist._id || createdPlaylist.id;

    const deletedPlaylist = await dbManager.deletePlaylist(testPlaylistId);

    expect(deletedPlaylist).not.toBeNull();

    const foundPlaylist = await dbManager.getPlaylistById(testPlaylistId);
    expect(foundPlaylist).toBeNull();

    testPlaylistId = null;
});

// Test 11: Get User Playlists
test('Test 11 - Getting User Playlists from the Database', async () => {
    const user = await dbManager.createUser(testUser);
    testUserId = user._id || user.id;

    const playlist = await dbManager.createPlaylist(testPlaylist);
    testPlaylistId = playlist._id || playlist.id;

    const userPlaylists = await dbManager.getUserPlaylists(testUserId);

    expect(Array.isArray(userPlaylists)).toBe(true);
});

// Test 12: Get Playlist Pairs by Owner Email
test('Test 12 - Getting Playlist Pairs by Owner Email from the Database', async () => {
    await dbManager.createUser(testUser);
    const createdPlaylist = await dbManager.createPlaylist(testPlaylist);
    testPlaylistId = createdPlaylist._id || createdPlaylist.id;

    const playlistPairs = await dbManager.getPlaylistPairsByOwnerEmail(testUser.email);

    expect(Array.isArray(playlistPairs)).toBe(true);
    expect(playlistPairs.length).toBeGreaterThan(0);

    // FIX: Use helper function to compare IDs
    const pair = playlistPairs.find(p => 
        compareIds(p._id, testPlaylistId)
    );
    
    expect(pair).toBeDefined();
    expect(pair.name).toBe(testPlaylist.name);
    expect(pair).toHaveProperty('_id');
    expect(pair).toHaveProperty('name');
    // These should be undefined as we only requested id and name
    expect(pair.songs).toBeUndefined();
    expect(pair.ownerEmail).toBeUndefined();
});

// Test 13: Database Connection and Basic Operations
test('Test 13 - Database Connection and Basic Operations', async () => {
    const testData = { 
        firstName: 'Test', 
        lastName: 'Connection', 
        email: 'testConnection@outlook.com', 
        passwordHash: 'test' 
    };
    const user = await dbManager.createUser(testData);

    expect(user).not.toBeNull();

    await dbManager.deleteUser(user._id || user.id);
});