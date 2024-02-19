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
### How Data is Modeled
![Wiki Structure](docs/Wiki_Structure.png)
1. Wiki - a collection of wiki_pages 
    * The wiki is the top level of your RAG-Query information store
    * Can invite other users to view and edit the wiki
2. Wiki Page - a collection of wiki_nodes
3. Wiki Node - the smallest information unit, contains a chunk of text from a wiki_page, and its text vector. 



## API 
### Auth
#### Sign In With Email and Password
> POST /api/auth/signin

Attempts to sign in a user based on email and password passed in the body of the request. 
**Example Request** 
```json
{
    "email": "email@example.com",
    "password": "supersecretpassword"
}
```

**Example Response (ERROR)** 
```json
{
    "error": "Invalid Credentials | Please provide all required fields"
}
```

**Example Response (SUCCESS)** 
```json
{
    "token": "<json web token>",
}
```


#### Sign Up 
> POST /api/auth/signup

Attempts to create a user based on displayName, email, and password passed in the body of the request. 
**Example Request** 
```json
{
    "displayName": "Test User",
    "email": "email@example.com",
    "password": "supersecretpassword"
}
```

**Example Response (ERROR)** 
```json
{
    "error": "That email is already in use | Please provide all required fields | Unknown Error "
}
```

**Example Response (SUCCESS)** 
```json
{
    "token": "<json web token>",
}
```

#### Forgot Password
> POST /api/auth/forgot-password

Initiates a password reset for the user associated with the provided email. The sent code expires after 10 minutes, and is used to verify the password reset request [See More](#reset-password)
** Example Request **
```json
{
    "email": "email@example.com"
}
```

** Example Response (ERROR) ** 
```json
{
    "error": "Must provide an email address | Unknown Error "
}
```

** Example Response (SUCCESS) ** 
```json
{
    "message": "Sent a password reset code to your email address. Enter the code to finish reseting your password"
}
```

#### Reset Password
> POST /api/auth/reset-password/:resetToken

#### Update Profile
> POST /api/auth/update-profile

### Wikis

#### Create a new Wiki
> POST /api/wikis/create

#### Create a wiki page
> POST /api/wikis/:wikiId/page?id=\<pageid>

#### Query A Wiki 
> POST /api/wikis/:wikiId/search







