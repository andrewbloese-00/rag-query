import { Router } from 'express'
import { protect } from '../middleware/protect';
import { useMongo } from '../utils/db';
import { checkUserPermission, insertWikiPage, queryWikiNodes } from '../utils/wikiHelpers';
import { ObjectId } from 'mongodb';
export const wikisRouter = Router();
wikisRouter.route("/create").post(protect,async (req,res)=>{
    try {
        const author = req.user._id.toHexString();
        if(!req.body.title || !author) return res.status(401).json({
            error: "Must provide a title for the new wiki!"
        })
        const db = await useMongo();
        const {insertedId} = await db.collection("wikis").insertOne({
            members: [author],
            wiki_title:req.body.title,
        })
        return res.status(201).json({wiki_id: insertedId.toHexString() ,error:null });
    } catch (error) {
        console.warn("Failed to create new wiki")
        console.error(error);
        return res
            .status(500)
            .json({ wiki_id: null, error: error.message || error || "unknown error"})
    }
})




wikisRouter.route("/:wiki_id/page")
    .post(protect,async (req,res)=>{
        if(!req.params.wiki_id) return res.status(401).json({error: "Must provide a wiki_id to create a wiki page!"});
        if(!req.body.title || !req.body.text) return res.status(401).json({
            error: "Must provide a title and text for the new wiki page!"
        })
        try {
            // step 1: verify the user has permission to be posting to the wiki
            const id = req.params.wiki_id
            const hasPermission = await checkUserPermission(id, req.user )
            if(!hasPermission) return res.status(403).json({error: "Invalid permissions to edit this wiki!"});

            //step 2: create wiki page - auto creates wiki nodes
            const { title, text } = req.body
            const tags = Array.isArray(req.body.tags) ? req.body.tags : []
            const result = await insertWikiPage(id,title,text,tags); //automatically embedds and creates nodes
            return res.status(201).json(result);
        } catch (error) {
            console.warn("Failed to create wiki page!")
            console.error(error);
            return res.status(500).json({error: error.message || error || "Unknown Error Occurred"});
        }
    })

wikisRouter.route("/:wiki_id/page").get(protect,async(req,res)=>{
    if(!req.params.wiki_id || !req.query.id) return res.status(400).json({error: "wiki id or page id not specified"});

    const wikiId = req.params.wiki_id;
    const pageId = req.query.id;

    const hasPermission = checkUserPermission(wikiId,req.user);
    if(!hasPermission) return res.status(403).json({error: "Permission Denied"});
    const db = await useMongo();
    const page = await db.collection("wiki_pages").findOne({_id: ObjectId.createFromHexString(pageId)})
    if(!page) return res.status(404).json({error: "Page Not Found!"})

    return res.status(200).json(page)
})



wikisRouter.route("/:wiki_id/search").post(protect, async (req,res)=>{
    try {
        const wikiId = req.params.wiki_id;
        if(!wikiId || !req.body.searchText) return res.status(400).json({
            error: "Must provide a wiki id and search text!"
        })
    
        const useEnrichment = (req.query.enrich_mode == 1)
        const tags = Array.isArray(req.body.tags) ? req.body.tags : []
    
        if(!wikiId) return res.status(400).json({error:"Must specify the wiki to search!"})
        const hasPermission = await checkUserPermission(wikiId,req.user);
        if(!hasPermission) return res.status(403).json({error:"Permission Denied!"})
        const response = await queryWikiNodes({
            useEnrichment, tags,
            searchText: req.body.searchText, 
            n: 10
        })
        const code = response.error === null ? 200 : 500
        res.status(code).json(response)
    } catch (error) {
        console.warn("Failed to query wiki nodes...")
        console.error(error)
        return res.status(500).json({error: error.message ||error || "Unknown Error"})
    }
})



