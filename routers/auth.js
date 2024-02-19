import { randomBytes } from 'crypto'
import { Router } from 'express';
import { useMongo } from '../utils/db';
import { hashString, validateHash } from '../utils/pwHasher';
import { createUserToken } from '../utils/jwtHelpers';
import { protect } from '../middleware/protect';
import { ObjectId } from 'mongodb';

const TEN_MINUTES_MS = 600000

export const authRouter = Router();




const generateAvatar = (displayName)=>`https://ui-avatars.com/api/?name=${displayName.replace(" ", "+")}`


// POST /api/auth/signup
authRouter.route("/signup").post(async (req, res) => {
    if(!req.body.displayName || !req.body.email || !req.body.password) return res.status(400).json({
        error: "Please provide a display name, email, and password to sign up!"
    })
    try {
        const db = await useMongo()
        const userExists = await db.collection("users").findOne({email: req.body.email});
        if(userExists) return res.status(400).json({error: "The provided email address is unavailable"})

        const { displayName, email, password } = req.body
        const hashedPassword = await hashString(password);
        const pfpURL = generateAvatar(displayName); //returns a url for auto generated profile picture
        const newUser = await db.collection("users").insertOne({
                displayName,email, pfpURL,
                password: hashedPassword
        })
        const {token,error} = createUserToken(newUser.insertedId.toHexString());
        if(error) return res.status(400).json({error,token:null})
        return res.status(200).json({token,error:null})
        
    } catch (error) {
        return res.status(500).json({error: error.message || error || "Unknown Error", token:null})
    }
})
// POST /api/auth/forgot-password
authRouter.route("/forgot-password").post(async (req, res) => {
    try {
        if(!req.body.email) return res.status(401).json({error:"Must provide an email address to request a password reset!"})
        const db = await useMongo()
        const resetCode = randomBytes(16).toString('hex') 
        const resetExpires = Date.now() + TEN_MINUTES_MS
        //update user if
        const setUserResetCode = await db.collection("users")
            .findOneAndUpdate(
                {email:req.body.email},
                {$set: {resetCode,resetExpires}}
            )
        
        if(!setUserResetCode) return res.status(404).json({error: "User not found!"});
        //TODO Send email
        return res.status(200).json({ message: "Sent a password reset message to your email address!"});
        
    } catch (error) {
        return res.status(200).json({ error: error.message || error || "Unknown Error"});
    }
})

//POST /api/auth/signin
authRouter.route("/signin").post(async (req, res) => {
    if(!req.body.email || !req.body.password) return res.status(401).json({error:"Please provide an email and password to sign in!"})
    const db = await useMongo();
    const user = await db.collection("users").findOne({email: req.body.email})
    if(!user) return res.status(401).json({error: "Invalid credentials"});
    const validPassword = await validateHash(req.body.password,user.password);
    if(validPassword) {
        const { token ,error } = createUserToken(user._id.toHexString());
        if(error) return res.status(500).json({error,token:null})
        res.status(200).json({token,error:null});
    } else { 
        return res.status(401).json({error: "Invalid credentials"});
    }
})

//POST /api/auth/update-profile
authRouter.route("/update-profile").post(protect, async (req,res) => {
    try {
        //user is in req.user
        let updates = {} 
        if(req.body.email) updates['email'] = req.body.email
        if(req.body.displayName) updates['displayName'] = req.body.displayName
        if(req.body.pfpURL) updates['pfpURL'] = req.body.pfpURL
    
        if(Object.keys(updates).length === 0) return res.status(401).json({success: false , message:"Invalid parameters. Editable properties are 'email','displayName',and 'pfpURL'"})

        const db = await useMongo()
        await db.collection("users").updateOne({_id: ObjectId.createFromHexString(req.user._id)}, {$set: updates})
        const updated = Object.keys(updates).join(", ")
        return res.status(200).json({success: true, message: `Successfully updated user: ${updated}` })
    } catch (error) {
        console.warn("failed to update profile");
        console.error(error);
        return { success: false, message: error.message || error || "Unknown Error"}
    }
})




//GET /api/auth/whoami
authRouter.get("/whoami",protect, async (req,res)=>{
    res.status(200).json({user:req.user})
})







