const jwt = require("jsonwebtoken")

function authManager() {
    verify = (req, res, next) => {
        console.log("req: " + req);
        console.log("next: " + next);
        console.log("Who called verify?");
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({
                    loggedIn: false,
                    user: null,
                    errorMessage: "Unauthorized"
                })
            }

            const verified = jwt.verify(token, process.env.JWT_SECRET)
            console.log("verified.userId: " + verified.userId);
            req.userId = verified.userId.toString();

            next();
        } catch (err) {
            console.error(err);
            return res.status(401).json({
                loggedIn: false,
                user: null,
                errorMessage: "Unauthorized"
            });
        }
    }

    verifyUser = (req) => {
        try {
            const token = req.cookies.token;
            if (!token) {
                return null;
            }

            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            return decodedToken.userId ? decodedToken.userId.toString(): null;
        } catch (err) {
            return null;
        }
    }

    signToken = (userId) => {
        let userIdString;

        if (userId === null || userId === undefined) {
            throw new Error("User ID cannot be null/undefined");
        }

        if (typeof userId === 'object' && userId.toString) {
            userIdString = userId.toString();
        }
        else if (typeof userId === 'string') {
            userIdString = userId;
        }

        else if (typeof userId === 'number') {
            userIdString = userId.toString();
        }

        else {
            userIdString = String(userId);
        }
        
        return jwt.sign({
            userId: userIdString
        }, process.env.JWT_SECRET);
    }

    return this;
}

const auth = authManager();
module.exports = auth;