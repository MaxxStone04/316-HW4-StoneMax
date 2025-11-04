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
        
        if (process.env.DB_TYPE === 'postgresql') {
            user.playlists = user.playlists || [];
            user.playlists.push(playlist.id); 
        } else {
            user.playlists.push(playlist._id);
        }
        
        await dbManager.updateUser(req.userId, { playlists: user.playlists });

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
        
        if (user.id.toString() === req.userId.toString()) {

            let updatedPlaylists;
            if (process.env.DB_TYPE === 'postgresql') {
                updatedPlaylists = user.playlists.filter(pid => pid.toString() !== req.params.id.toString());
            } else {
                updatedPlaylists = user.playlists.filter(pid => pid.toString() !== req.params.id.toString());
            }
            
            await dbManager.updateUser(user.id, { playlists: updatedPlaylists });
            
            await dbManager.deletePlaylist(req.params.id);
            
            return res.status(200).json({});
        } else {
            return res.status(400).json({ 
                errorMessage: "authentication error" 
            });
        }
    } catch (error) {
        console.error(error);
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
        
        if (user.id.toString() === req.userId.toString()) {
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
            errorMessage: errpr });
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
        
        const playlists = await dbManager.getPlaylistPairsByOwnerEmail(user.email);
        console.log("found Playlists: " + JSON.stringify(playlists));
        
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
    } catch (error) {
        console.error(error);
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