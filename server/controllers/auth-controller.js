const auth = require('../auth')
const bcrypt = require('bcryptjs')
const { createDatabaseManager } = require('../db/create-Database-Manager'); // Fixed import path
const dbManager = createDatabaseManager();

getLoggedIn = async (req, res) => {
    try {
        let userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(200).json({
                loggedIn: false,
                user: null,
                errorMessage: "?"
            })
        }

        const loggedInUser = await dbManager.getUserById(userId);
        console.log("loggedInUser: " + loggedInUser);

        if (!loggedInUser) {
            return res.status(200).json({
                loggedIn: false,
                user: null,
                errorMessage: "User not found"
            })
        }

        return res.status(200).json({
            loggedIn: true,
            user: {
                firstName: loggedInUser.firstName,
                lastName: loggedInUser.lastName,
                email: loggedInUser.email
            }
        })
    } catch (err) {
        console.log("err: " + err);
        res.json(false);
    }
}

loginUser = async (req, res) => {
    console.log("loginUser");
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ errorMessage: "Please enter all required fields." });
        }

        const existingUser = await dbManager.getUserByEmail(email);
        console.log("existingUser: ", existingUser); // Use comma for better logging
        if (!existingUser) {
            return res
                .status(401)
                .json({
                    errorMessage: "Wrong email or password provided."
                })
        }

        console.log("provided password: " + password);
        const passwordCorrect = await bcrypt.compare(password, existingUser.passwordHash);
        if (!passwordCorrect) {
            console.log("Incorrect password");
            return res
                .status(401)
                .json({
                    errorMessage: "Wrong email or password provided."
                })
        }

        // LOGIN THE USER
        // Get the user ID based on database type
        let userId;
        if (existingUser._id) {
            // MongoDB
            userId = existingUser._id;
        } else if (existingUser.id) {
            // PostgreSQL
            userId = existingUser.id;
        } else {
            throw new Error("Could not find user ID");
        }

        console.log("User ID to sign token:", userId);
        
        // FIX: Pass the userId variable, not existingUser._id
        const token = auth.signToken(userId);
        console.log("Token created successfully");

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: true
        }).status(200).json({
            success: true,
            user: {
                firstName: existingUser.firstName,
                lastName: existingUser.lastName,  
                email: existingUser.email              
            }
        })

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send();
    }
}

logoutUser = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: true,
        sameSite: "none"
    }).send();
}

registerUser = async (req, res) => {
    console.log("REGISTERING USER IN BACKEND");
    try {
        const { firstName, lastName, email, password, passwordVerify } = req.body;
        console.log("create user: " + firstName + " " + lastName + " " + email + " " + password + " " + passwordVerify);
        if (!firstName || !lastName || !email || !password || !passwordVerify) {
            return res
                .status(400)
                .json({ errorMessage: "Please enter all required fields." });
        }
        console.log("all fields provided");
        if (password.length < 8) {
            return res
                .status(400)
                .json({
                    errorMessage: "Please enter a password of at least 8 characters."
                });
        }
        console.log("password long enough");
        if (password !== passwordVerify) {
            return res
                .status(400)
                .json({
                    errorMessage: "Please enter the same password twice."
                })
        }
        console.log("password and password verify match");
        const existingUser = await dbManager.getUserByEmail(email);
        console.log("existingUser: " + existingUser);
        if (existingUser) {
            return res
                .status(400)
                .json({
                    success: false,
                    errorMessage: "An account with this email address already exists."
                })
        }

        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(password, salt);
        console.log("passwordHash: " + passwordHash);

        const newUser = await dbManager.createUser({firstName, lastName, email, passwordHash});
        console.log("new user saved:", newUser);

        // LOGIN THE USER
        // Get the user ID based on database type
        let userId;
        if (newUser._id) {
            // MongoDB
            userId = newUser._id;
        } else if (newUser.id) {
            // PostgreSQL
            userId = newUser.id;
        } else {
            throw new Error("Could not find user ID in new user");
        }

        console.log("User ID for new user:", userId);
        
        // FIX: Use the userId variable and correct variable name (newUser, not savedUser)
        const token = auth.signToken(userId);
        console.log("token:" + token);

        await res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        }).status(200).json({
            success: true,
            user: {
                firstName: newUser.firstName, // Fixed: newUser, not savedUser
                lastName: newUser.lastName,   // Fixed: newUser, not savedUser
                email: newUser.email          // Fixed: newUser, not savedUser
            }
        })

        console.log("token sent");

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}

module.exports = {
    getLoggedIn,
    registerUser,
    loginUser,
    logoutUser
}