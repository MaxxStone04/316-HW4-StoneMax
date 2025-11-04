const auth = require('../auth')

const { createDatabaseManager } = require('../db/create-Database-Manager')
const dbManager = createDatabaseManager();

const compareUserIds = (id1, id2) => {
    return id1.toString() === id2.toString();
};

// Helper function to get user ID from user object
const getUserId = (user) => {
    return user._id || user.id;
};

createPlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    const body = req.body;
    console.log("createPlaylist body: " + JSON.stringify(body));
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a Playlist',
        })
    }
    
    try {
        const playlist = await dbManager.createPlaylist(body);
        console.log("playlist created: " + JSON.stringify(playlist));

        const user = await dbManager.getUserById(req.userId);
        console.log("user found: " + JSON.stringify(user));
        
        if (!user) {
            return res.status(400).json({
                errorMessage: 'User not found!'
            });
        }
        
        // Update user's playlists array
        let updatedPlaylists;
        if (user.playlists) {
            // MongoDB - playlists is an array of ObjectIds
            updatedPlaylists = [...user.playlists, playlist._id || playlist.id];
        } else {
            // PostgreSQL - playlists is an array of integers or we need to create it
            updatedPlaylists = [playlist._id || playlist.id];
        }
        
        await dbManager.updateUser(req.userId, { playlists: updatedPlaylists });

        return res.status(201).json({
            playlist: playlist
        })
    } catch (error) {
        console.error('Error creating playlist:', error);
        return res.status(400).json({
            errorMessage: 'Playlist Not Created!'
        })
    }
}

deletePlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    console.log("delete Playlist with id: " + JSON.stringify(req.params.id));
    
    try {
        const playlist = await dbManager.getPlaylistById(req.params.id);
        console.log("playlist found: " + JSON.stringify(playlist));
        
        if (!playlist) {
            return res.status(404).json({
                errorMessage: 'Playlist not found!',
            })
        }

        // DOES THIS LIST BELONG TO THIS USER?
        const user = await dbManager.getUserByEmail(playlist.ownerEmail);
        if (!user) {
            return res.status(404).json({
                errorMessage: 'User not found!'
            });
        }
        
        const userId = getUserId(user);
        console.log("user ID: " + userId);
        console.log("req.userId: " + req.userId);
        
        if (compareUserIds(userId, req.userId)) {
            console.log("correct user!");
            
            // Remove playlist from user's playlists array
            const updatedPlaylists = user.playlists ? user.playlists.filter(pid => 
                !compareUserIds(pid, req.params.id)
            ) : [];
            await dbManager.updateUser(userId, { playlists: updatedPlaylists });
            
            // Delete the playlist
            await dbManager.deletePlaylist(req.params.id);
            
            return res.status(200).json({});
        } else {
            console.log("incorrect user!");
            return res.status(400).json({ 
                errorMessage: "authentication error" 
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(400).json({ 
            errorMessage: 'Error deleting playlist' 
        });
    }
}

getPlaylistById = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    console.log("Find Playlist with id: " + JSON.stringify(req.params.id));

    try {
        const list = await dbManager.getPlaylistById(req.params.id);
        if (!list) {
            return res.status(400).json({ success: false, error: 'Playlist not found' });
        }
        console.log("Found list: " + JSON.stringify(list));

        // DOES THIS LIST BELONG TO THIS USER?
        const user = await dbManager.getUserByEmail(list.ownerEmail);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const userId = getUserId(user);
        console.log("user ID: " + userId);
        console.log("req.userId: " + req.userId);
        
        if (compareUserIds(userId, req.userId)) {
            console.log("correct user!");
            return res.status(200).json({ success: true, playlist: list })
        } else {
            console.log("incorrect user!");
            return res.status(400).json({ success: false, description: "authentication error" });
        }
    } catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, error: err });
    }
}

getPlaylistPairs = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    console.log("getPlaylistPairs");
    
    try {
        const user = await dbManager.getUserById(req.userId);
        if (!user) {
            return res.status(404).json({
                errorMessage: 'User not found!'
            });
        }
        
        console.log("find user with id " + req.userId);
        
        console.log("find all Playlists owned by " + user.email);
        const playlists = await dbManager.getPlaylistPairsByOwnerEmail(user.email);
        console.log("found Playlists: " + JSON.stringify(playlists));
        
        if (!playlists || playlists.length === 0) {
            console.log("!playlists.length");
            return res
                .status(404)
                .json({ success: false, error: 'Playlists not found' })
        } else {
            console.log("Send the Playlist pairs");
            return res.status(200).json({ success: true, idNamePairs: playlists })
        }
    } catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, error: err })
    }
}

getPlaylists = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    
    try {
        const user = await dbManager.getUserById(req.userId);
        if (!user) {
            return res.status(404).json({
                errorMessage: 'User not found!'
            });
        }
        
        const playlists = await dbManager.getPlaylistsByOwnerEmail(user.email);
        
        return res.status(200).json({ success: true, data: playlists })
    } catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, error: err })
    }
}

updatePlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    const body = req.body
    console.log("updatePlaylist: " + JSON.stringify(body));
    console.log("req.body.name: " + req.body.name);

    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body to update',
        })
    }

    try {
        const playlist = await dbManager.getPlaylistById(req.params.id);
        console.log("playlist found: " + JSON.stringify(playlist));
        
        if (!playlist) {
            return res.status(404).json({
                err: 'Playlist not found',
                message: 'Playlist not found!',
            })
        }

        // DOES THIS LIST BELONG TO THIS USER?
        const user = await dbManager.getUserByEmail(playlist.ownerEmail);
        if (!user) {
            return res.status(404).json({
                errorMessage: 'User not found!'
            });
        }
        
        const userId = getUserId(user);
        console.log("user ID: " + userId);
        console.log("req.userId: " + req.userId);
        
        if (compareUserIds(userId, req.userId)) {
            console.log("correct user!");
            console.log("req.body.name: " + req.body.name);

            const updatedPlaylist = await dbManager.updatePlaylist(req.params.id, {
                name: body.playlist.name,
                songs: body.playlist.songs
            });
            
            console.log("SUCCESS!!!");
            return res.status(200).json({
                success: true,
                id: updatedPlaylist._id || updatedPlaylist.id,
                message: 'Playlist updated!',
            })
        } else {
            console.log("incorrect user!");
            return res.status(400).json({ success: false, description: "authentication error" });
        }
    } catch (error) {
        console.log("FAILURE: " + JSON.stringify(error));
        return res.status(404).json({
            error,
            message: 'Playlist not updated!',
        })
    }
}

module.exports = {
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getPlaylistPairs,
    getPlaylists,
    updatePlaylist
}