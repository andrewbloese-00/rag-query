import { Router } from 'express';
import { useMongo } from '../utils/db';
import { validateHash } from '../utils/pwHasher';
import { createUserToken } from '../utils/jwtHelpers';

export const authRouter = Router();


// POST /api/auth/signin
authRouter.route("/signin").post(async (req, res) => {
    if(!req.body.email || !req.body.password) return res
        .status(401)
        .json({error: "Invalid Parameters: Please provide an email and password to sign in"});
    
    const db = await useMongo()
    const user = await db.collection("users").findOne({email})
    if(!user) return res
        .status(401)
        .json({error: "Invalid Credentials!"})

    //check password with stored hash
    const validPassword = await validateHash(req.body.password, user.password)

    if(validPassword){
        // generate token
        const token = createUserToken(user._id.toHexString())

    }


})

// POST /api/auth/signup
authRouter.route("/signup").post(async (req, res) => {
    
})
// POST /api/auth/forgot-password
authRouter.route("/forgot-password").post(async (req, res) => {

})

//POST /api/auth/resetPassword/:resetToken
authRouter.route("/signin").post(async (req, res) => {

})

//POST /api/auth/update-profile
authRouter.route("/update-profile").post(async (req,res) => {


})