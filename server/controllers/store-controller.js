const auth = require('../auth')

const { createDatabaseManager } = require('../db/create-Database-Manager')
const dbManager = createDatabaseManager();
/*
    This is our back-end API. It provides all the data services
    our database needs. Note that this file contains the controller
    functions for each endpoint.
    
    @author McKilla Gorilla
*/

const compareUserIds = (id1, id2) => {
    return id1.toString() === id2.toString();
};

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
        console.log("Playlist created: " + JSON.stringify(playlist));

        const user = await dbManager.getUserById(req.userId);
        
        if (!user) {
            return res.status(400).json({
                errorMessage: 'User not found!'
            });
        }
        
        let updatedPlaylists;
        if (user.playlists) {
            updatedPlaylists = [...user.playlists, playlist._id || playlist.id];
        } else {
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
    try {
        const playlist = await dbManager.getPlaylistById(req.params.id);
        
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
        
        if (compareUserIds(userId, req.userId)) {
            
            const updatedPlaylists = user.playlists ? user.playlists.filter(pid => !compareUserIds(pid, req.params.id)) : [];
            await dbManager.updateUser(userId, { playlists: updatedPlaylists });
            
            await dbManager.deletePlaylist(req.params.id);
            
            return res.status(200).json({});
        } else {
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
    try {
        const list = await dbManager.getPlaylistById(req.params.id);
        if (!list) {
            return res.status(400).json({ 
                success: false, 
                errorMessage: 'Playlist not found' 
            });
        }
        console.log("Found list: " + JSON.stringify(list));

        // DOES THIS LIST BELONG TO THIS USER?
        const user = await dbManager.getUserByEmail(list.ownerEmail);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                errorMessage: 'User not found' 
            });
        }
        
        const userId = getUserId(user);
        
        if (compareUserIds(userId, req.userId)) {
            return res.status(200).json({ 
                success: true, 
                playlist: list 
            })
        } else {
            return res.status(400).json({ 
                success: false, 
                errorMessage: "authentication error" 
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(400).json({ 
            success: false, 
            errorMessage: error 
        });
    }
}

getPlaylistPairs = async (req, res) => {
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
        
        const playlists = await dbManager.getPlaylistPairsByOwnerEmail(user.email);
        
        if (!playlists || playlists.length === 0) {
            return res.status(404).json({ 
                success: false, 
                errorMessage: 'Playlists not found' 
            })
        } else {
            return res.status(200).json({ 
                success: true, 
                idNamePairs: playlists 
            })
        }
    } catch (errpr) {
        console.error(error);
        return res.status(400).json({ 
            success: false, 
            errorMessage: error })
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
        
        return res.status(200).json({ 
            success: true, 
            data: playlists 
        })
    } catch (error) {
        console.error(error);
        return res.status(400).json({ 
            success: false, 
            errorMessage: error 
        })
    }
}

updatePlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    const body = req.body

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
                errorMessage: 'Playlist not found',
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
        
        if (compareUserIds(userId, req.userId)) {

            const updatedPlaylist = await dbManager.updatePlaylist(req.params.id, {
                name: body.playlist.name,
                songs: body.playlist.songs
            });

            return res.status(200).json({
                success: true,
                id: updatedPlaylist._id || updatedPlaylist.id,
                message: 'Playlist updated!',
            })
        } else {
            return res.status(400).json({ 
                success: false, 
                errorMessage: "authentication error" 
            });
        }
    } catch (error) {
        return res.status(404).json({
            errorMessage: 'Playlist not updated!'
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