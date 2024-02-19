export const resetPasswordEmailTemplate = (resetCode) => ({
    text: `Password Reset Code: ${resetCode}. Code will expire in 10 minutes.`, 
    html: /*html*/`
    <html lang="en">
        <head>
            <style>
                * { box-sizing: border-box;}
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
                    padding: 20px;
                    font-size: 18px;
                    text-align: center;
                }

                hr.mini {width: 20%}

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

                .secret_code_container {
                    width: 300px;
                    padding:10px;
                }
                .secret_code_container h4 { 
                    margin-bottom: 0;
                    width: 100%;
                    text-align: center;
                    font-size: 25px;
                    background-color: royalblue;
                    color: white;
                    padding: 10px;
                    border-top-left-radius: 10px;
                    border-top-right-radius: 10px;
                }

                .code_chars { 
                    display: inline-flex;
                    place-items: center;
                    width: 100%;
                    border: 1px solid #333;
                    border-top: none;
                    align-items: center;
                    justify-content: center;
                    border-bottom-left-radius: 10px;
                    border-bottom-right-radius: 10px;
                    padding-block: 20px;
                    font-size: 24px;
                    letter-spacing: 0.5em
                }
            </style>
        </head>
        <body>
            <header>
                <h1> RAG QUERY </h1>
            </header>
            
            <section class="container">
                <img class="logo" src="https://placehold.co/200x200"/>
                <h2>Password Reset Request</h2>
                <hr/>
                <p> We've recieved your request to reset your password! Enter the code where prompted in the RAG Query web app!</p>
                
                <section class="secret_code_container">
                <h4>Your code</h4>
                <div class="code_chars"> 
                    ${resetCode}
                </div>
                
            </section>
                
                <hr class="mini">
                <div class="disclaimer">
                    <p> If you did not request a password reset, you can ignore this email and the code will automatically expire. </p>
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
