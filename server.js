import express from "express";
import { PORT } from "./env.js";
import { useMongo } from "./utils/db.js";
import { authRouter } from './routers/auth.js'
import { wikisRouter } from './routers/wikis.js'

async function launchServer(){
    const db = await useMongo()
    const app = express();

    //api accepts json and forms
    app.use(express.json())
    app.use(express.urlencoded({extended:true}));
    

    app.use("/api/auth",authRouter);
    app.use("/api/wikis",wikisRouter);

    app.listen(PORT,()=>{
        console.log(`🚀 Server started on port ${PORT}`);
    })

}

launchServer();