var express = require("express");
var bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
require('dotenv').config();

//set port [3000 if testing from home PC, otherwise let hosting server set its own port]
const PORT = process.env.PORT || 3000;
var app = express();
var body;

const config = {
    "client_id": process.env.EXTENSION_CLIENT_ID,
    "extension_secret": process.env.EXTENSION_CLIENT_SECRET,
};

//Decode the extension secret for verification
const ext_secret = Buffer.from(config.extension_secret, 'base64');

//Start the server
app.listen(PORT, () => {
    console.log("Server listening on port " + PORT);
   });

// create application/json parser
var jsonParser = bodyParser.json()
 
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

//Allows extenion to run external javascript. See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS 
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    // The origin of an extension iframe will be null so the Access-Control-Allow-Origin has to be wildcard.
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });
  const bearerPrefix = 'Bearer ';

  function verifyAndDecode(header) {
    if (header.startsWith(bearerPrefix)) {
      try {
        const streamertoken = header.substring(bearerPrefix.length);
        return jwt.verify(streamertoken, ext_secret, { algorithms: ['HS256'] });
      }
      catch (e) {
        return console.log('Invalid JWT');
      }
    }
  }
  //Respond to the POST call, check for the payload
  app.post('/config', jsonParser, function (req, res) {
    const payload = verifyAndDecode(req.headers.authorization);
    if (payload) {
    body = req.body;
    const content = body.content;
    
    //establish the PubSub payload
    const PubSubPayload = {
      "exp": Math.floor(new Date().getTime() / 1000) + 4,
      "user_id": body.content.user,
      "role": "external",
      "channel_id": body.content.user,
      "pubsub_perms": {
          "send": [
              "broadcast"
          ]
      }
    }
    //sign the payload
    const PubSubConfig = jwt.sign(PubSubPayload, ext_secret);

    fetch(
        "https://api.twitch.tv/helix/extensions/pubsub",
        {
            method: "POST",
            headers: {
                "Client-ID": config.client_id,
                "Authorization": "Bearer " + PubSubConfig,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                target: PubSubPayload.pubsub_perms.send,
                broadcaster_id: body.content.user,
                is_global_broadcast: false,
                message: JSON.stringify({
                    event: "configure",
                    data: content
                })
            })
        }
    ).then(resp => {
    //Keep note of rate limits... cannot make too many requests too quickly
    console.error('Relay PubSub OK', resp.status, resp.headers.get('ratelimit-remaining'), '/', resp.headers.get('ratelimit-limit'));
})
.catch(err => {
    console.error(err);
});  
    }
  });