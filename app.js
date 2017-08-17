'use strict'

// Retrieve
var MongoClient = require('mongodb').MongoClient;
let atlas_connection_uri;
let cachedDb = null;

exports.handler = (event, context, callback) => {
    var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];
    if (atlas_connection_uri != null) {
        processEvent(event, context, callback);
    }
    else {
        atlas_connection_uri = uri;
        console.log('the Atlas connection string is ' + atlas_connection_uri);
        processEvent(event, context, callback);
    }
};

function processEvent(event, context, callback) {
    console.log('Calling MongoDB Atlas from AWS Lambda with event: ' + JSON.stringify(event));
    var jsonContents = JSON.parse(JSON.stringify(event));
    console.log(jsonContents.ticket)
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        if (cachedDb == null) {
            console.log('=> connecting to database');
            MongoClient.connect(atlas_connection_uri, function (err, db) {
                cachedDb = db;
                return getDoc(db, jsonContents, callback);
            });
        }
        else {
             getDoc(cachedDb, jsonContents, callback);
        }
    }
    catch (err) {
        console.error('an error occurred', err);
    }
};
function getDoc (db, json, callback) {
    console.log(json.ticket)
    db.collection('BIE-SERVER-DEV.students').findOne({"ticket": Number(json.ticket)}, function(err, doc) {
        if(err!=null) {
            console.error("an error occurred in gettingDoc", err);
            callback(null, JSON.stringify(err));
        }
        else {
            console.log("student doc" + doc.stdntname);
            callback(null, doc);
        }
        //we don't need to close the connection thanks to context.callbackWaitsForEmptyEventLoop = false (above)
        //this will let our function re-use the connection on the next called (if it can re-use the same Lambda container)
        //db.close();
    });
};