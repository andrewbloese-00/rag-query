# RAG-Query 
A query engine for retrieval augmented generation and semantic search. Uses openai `text-embedding-3-small` to generate embeddings on text. 

## Current Features
* Sentence extractor with customizable abbreviation detection. 
* Text windows with variable sentence overlap to improve query granularity
* Upload `wiki_pages` and `wiki_nodes` to a mongodb database. 
    * Recommend setting up proper search indexes (see mongo docs)
* Retrieve relevant information based on user queries. 
## Working...
* Filter by `wiki_title` or `tags` 
* Query enrichment using generative ai (allows the system to add relevant details to the query to widen search results)




## About
There are 3 main units of information available in RAG-Query
1. Wiki - a collection of wiki_pages 
    * The wiki is the top level of your RAG-Query information store
2. Wiki Page - a collection of wiki_nodes
3. Wiki Node - the smallest information unit, contains a chunk of text from a wiki_page, and its text vector. 


