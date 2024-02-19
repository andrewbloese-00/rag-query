import express from "express";
import { PORT } from "./env";
import { useMongo } from "./utils/db";
import { authRouter } from './routers/auth'
import { wikisRouter } from './routers/wikis'

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