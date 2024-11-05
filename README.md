# birdstats-extension-backend
Twitch Extensions can be configured using Twitch's built in configuration service and/or via the PubSub API. This backent server accepts HTTP POST calls from frontend extension files hosted on Twitch. Calls are validated using JSON Web Token (JWT) against your Client info; invalid calls result in a console error. I initially created this backend server to handle live configuration updates for my Bird Stats! Twitch Extension; however, the code is generic enough to handle (or be easily modified to handle) valid POST requests for your own Twitch extensions as well. Once a request is validated, it is submitted to the broadcaster's PubSub segment and given an event name 'configure'. The frontend components of the extension then rely on a callback function that listens for events with the configure tag. 

# Installation 
Installation is only necessary if you plan to use this server for your own Twitch extension; The Bird Stats! extension files are already hosted and require no action on your part. If you do plan on using the files in this repository for your own backend extension server, first clone or download this repository and then use the dotenv_template file to create and save your own .env file. Obtain your Extension Client ID and Extension Client Secret from your Twitch Developer Console and input those values in the "" for each item in your .env file. If hosting locally (e.g., for testing purposes, for example), you can execute the following commands in sequence: 
```
npm install
node index.js
``` 
