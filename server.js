const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const adtService = require("./adtService");

const DEFAULT_PORT = process.env.PORT || 3000;
let port = DEFAULT_PORT;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static(__dirname + "/public")); // expose files

app.post("/createModel", adtService.createModel);
app.post("/createTwin", adtService.createTwin);
app.patch("/updateTwin", adtService.updateTwin);

// Start the server.
app.listen(port);
console.log(`Listening on port ${port}...`);
