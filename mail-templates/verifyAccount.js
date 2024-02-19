export const verifyAccountTemplate = (verificationLink) => ({
    text: `In order to activate your RAG QUERY account, you must verify your email address. Use the following link to verify your email address: ${verificationLink}`,
    html: /*html*/`
    <html>
        <head>
            <style>
                * { 
                    box-sizing: border-box;
                }
                body, html { 
                    margin: 0;
                    padding: 0;
                    max-height: 100vh;
                    background: #eee;
                    
                }
                
                .name { 
                    font-family: monospace;
                    color: royalblue;
                    font-size: 15px
                }
                
                header {
                    padding:10px 0;
                    margin: 0;
                /*   position: absolute; */
                    top: 0px;
                    left: 0;
                    width: 100%;
                    display: grid;
                    place-items:center;
                    color: royalblue;
                    font-family: monospace;
                }
                
                .container .logo {
                    margin: 1rem auto;
                    width: 100px; 
                    aspect-ratio: 1/1;
                    border-radius: 100%;
                    object-fit: scale-down;
                } 
                
                .container { 
                    font-family: sans-serif;
                    background: #fff;
                    box-shadow: 1px 1px 4px rgba(0,0,0,0.7);
                    width: 80%;
                    max-width: 400px;
                    margin: 5vh auto;
                    margin-top: 0;
                    border-radius: 20px;
                    padding: 10px;
                    display: flex; 
                    flex-direction: column;
                    justify-content: space-evenly;
                    align-items: center;
                }
                
                .container h2 { 
                    text-align: center;
                }
                .container hr { 
                    color: rgba(0,0,0,.2);
                    width: 80%;
                }
                
                .container a { 
                    display: block;
                    padding: 10px;
                    width: 250px;
                    margin: 2rem auto;
                    text-align:center;
                    text-decoration: none;
                    background-color: transparent;
                    color: royalblue; 
                    border: 2px solid royalblue;
                    border-radius: 5px;
                    
                }
                
                .container p { 
                    width: 80%;
                    font-size: 16px;
                    text-align: center;
                
                }
                
                hr.mini { 
                    width: 20%
                }
                
                .disclaimer { 
                    color: rgba(0,0,0,0.4);
                    font-size: 12px;
                    width: 100%;
                    display: grid;
                    place-items: center;
                    
                }
                
                footer { 
                    display: flex;
                    flex-direction: column; 
                    align-items: center;
                }
                
                footer p { 
                    font-size: 12px;
                    color: rgba(0,0,0,0.5);
                
                }
            </style>
        </head>
        <body>
            <header>
                <h1> RAG QUERY </h1>
            </header>
    
            <section class="container">
                <img class="logo" src="https://placehold.co/200x200"/>
                <h2>Verify Your Email Address</h2>
                <hr/>
                <p>
                In order to activate your <span class="name">RAG QUERY</span> account, you must verify your email address. 
                <a href="${verificationLink}" target="_blank" rel="noopener noreferrer">
                    Verify Email Address
                </a>
                <hr class="mini">
                <div class="disclaimer">
                    <p> If you did not sign up for this account you can ignore this email and the account will be automatically deleted. </p>
                </div>
                </p>
                
                
            </section>
            <footer>
                <p> &copy RAG QUERY 2024 </p>
            </footer>  
        </body>
    </html>
    `
})