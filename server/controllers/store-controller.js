const auth = require('../auth')

const { createDatabaseManager } = require('../db');
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
        console.log("playlist: " + playlist.toString());
        
        const user = await dbManager.getUserById(req.userId);
        console.log("user found: " + JSON.stringify(user));

        user.playlists.push(playlist._id);
        await dbManager.updateUser(req.userId, { playlists: user.playlists });

        return res.status(201).json({
            playlist: playlist
        })
    } catch (error) {
        return res.status(400).json({
            errorMessage: 'Playlist not created!'
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

        const user = await dbManager.getUserByEmail(playlist.ownerEmail);
        
        if (user._id.toString() === req.userId) {
            user.playlists = user.playlists.filter(pid => pid.toString() !== req.params.id);
            await dbManager.updateUser(user._id, { playlists: user.playlists });

            await dbManager.deletePlaylist(req.params.id);

            return res.status(200).json({});
        } else {
            console.log("incorrect user!");
            return res.status(400).json({
                errorMessage: "Authentication error"
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
            return res.status(400).json({
                success: false,
                error: 'Playlist not found'
            });
        }
        
        const user = await dbManager.getUserByEmail(list.ownerEmail);

        if (user._id.toString() === req.userId) {
            return res.status(200).json({
                success: true,
                playlist: list
            })
        } else {
            console.log("incorrect user")
            return res.status(400).json({
                success: false,
                errorMessage: "Authentication error"
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            success: false,
            error: err
        });
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
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            success: false,
            error: err
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
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            success: false,
            error: err
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
        
        if (!playlist) {
            return res.status(404).json({
                errorMessage: 'Playlist not found',
            })
        }

        const user = await dbManager.getUserByEmail(playlist.ownerEmail);

        if (user._id.toString() === req.userId) {
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
            console.log("incorrect user!");
            return res.status(400).json({
                success: false,
                errorMessage: "Authentication error"
            });
        }
    } catch (error) {
        return res.stauts(404).json({
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