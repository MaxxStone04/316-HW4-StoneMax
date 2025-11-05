const auth = require('../auth')

const { createDatabaseManager } = require('../db/create-Database-Manager')
const dbManager = createDatabaseManager();

/*
    This is our back-end API. It provides all the data services
    our database needs. Note that this file contains the controller
    functions for each endpoint.
    
    @author McKilla Gorilla
*/

createPlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    const body = req.body;
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a Playlist',
        })
    }
    
    try {
        const user = await dbManager.getUserById(req.userId);

        const playlistData = {...body, ownerEmail: user.email};
        const playlist = await dbManager.createPlaylist(playlistData);
        
        const playlistId = playlist._id || playlist.id;
        const currentPlaylists = user.playlists || [];
        const updatedPlaylists = [...currentPlaylists, playlistId];

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
        
        if (!playlist) {
            return res.status(404).json({
                errorMessage: 'Playlist not found!',
            })
        }

        // DOES THIS LIST BELONG TO THIS USER?
        const user = await dbManager.getUserByEmail(playlist.ownerEmail);
        console.log("user._id: " + user._id);
        console.log("req.userId: " + req.userId);
        
        if (playlist.ownerEmail === user.email) {
            
            const currentPlaylists = user.playlists || [];
            const updatedPlaylists = currentPlaylists.filter(pid => {
                const pidString = pid.toString();
                const targetIdString = req.params.id.toString();
                return pidString !== targetIdString;
            });
            await dbManager.updateUser(user._id, { playlists: updatedPlaylists });
            
            await dbManager.deletePlaylist(req.params.id);
            
            return res.status(200).json({});
        } else {
            return res.status(400).json({ 
                errorMessage: "Authentication Error" 
            });
        }
    } catch (error) {
        console.error("Error with deleting the playlist:", error);
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
            return res.status(400).json({ 
                success: false, 
                errorMessage: 'Playlist not found' 
            });
        }

        // DOES THIS LIST BELONG TO THIS USER?
        const user = await dbManager.getUserById(req.userId);

        if (list.ownerEmail === user.email) {
            return res.status(200).json({ 
                success: true, 
                playlist: list 
            })
        } else {
            return res.status(400).json({ 
                success: false, 
                errorMessage: "Authentication Error" 
            });
        }
    } catch (error) {
        console.error("Error Retrieving Playlist:", error);
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
        
        const playlists = await dbManager.getPlaylistPairsByOwnerEmail(user.email);
        
        if (!playlists || playlists.length === 0) {
            return res.status(200).json({ 
                success: true, 
                idNamePairs: [] 
            })
        } else {
            return res.status(200).json({ 
                success: true, 
                idNamePairs: playlists 
            })
        }
    } catch (error) {
        console.error("Error Retrieving Playlist Pairs:", error);
        return res.status(400).json({ 
            success: false, 
            errorMessage: error 
        })
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
        const playlists = await dbManager.getPlaylistsByOwnerEmail(user.email);
        
        return res.status(200).json({ 
            success: true, 
            data: playlists 
        })
    } catch (error) {
        console.error("Error Retrieving Playlists", error);
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
            errorMessage: 'You must provide a body to update',
        })
    }

    try {
        const playlist = await dbManager.getPlaylistById(req.params.id);
        
        if (!playlist) {
            return res.status(404).json({
                errorMessage: 'Playlist not found'
            })
        }

        // DOES THIS LIST BELONG TO THIS USER?
        const user = await dbManager.getUserByEmail(playlist.ownerEmail);

        if (playlist.ownerEmail === user.email) {

            const updatedPlaylist = await dbManager.updatePlaylist(req.params.id, {
                name: body.playlist.name,
                songs: body.playlist.songs
            });
            
            return res.status(200).json({
                success: true,
                id: updatedPlaylist._id,
                message: 'Playlist updated!',
            })
        } else {
            return res.status(400).json({ 
                success: false, 
                errorMessage: "Authentication Error" });
        }
    } catch (error) {
        console.log("Error Updating Playlist", error);
        return res.status(404).json({
            errorMessage: 'Playlist not updated!',
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