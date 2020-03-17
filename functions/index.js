const functions = require('firebase-functions');
const { fetch } = require("./src");
const boards = require("./src/boards.json");
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
//
exports.scheduledFunction = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(context => {
    fetch(boards);
    //    console.log("This will be run every 1 minutes!");
    return null;
  });
