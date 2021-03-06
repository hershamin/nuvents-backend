﻿// Dependencies
var Summary = require('../Schema/eventSummary.js')
var Detail = require('../Schema/eventDetail.js')
var Request = require('../Schema/eventRequest.js')

// Event request to add city
exports.addEventRequest = function (socket, data, callback) {
	
    // Acknowledge Client
    try {
        callback('Event City Request Received');
    } catch (e) {}

	// Check if JSON needs to be parsed
    try {
        data = JSON.parse(data);
    } catch (e) {}

    // Typical request
    //  data.city: City Name
    //  data.state: State Name
    //  data.zip: Postal code of that region
    //  data.email: User email to send when city is added to network
    //	data.name: Name the user is providing in the text box
    //	data.latlng: Lat,Lng GPS coordinates
    //	data.did: Unique Device ID

    // Add current EPOCH UTC timestamp to data
    timeStamp = Date.now() / 1000 | 0
    data.timestamp = timeStamp

    // Add to mongo DB
    var eventReq = new Request(data)
    eventReq.save(function(err, req) {})
}

// Read all event request objects from DB
exports.getEventRequests = function (req, res) {
    // Send all request objects from DB
    Request.find({}, 'city state zip email name latlng did', function(err, requests) {
        for (var i=0; i<requests.length; i++) {
            var request = requests[i].toObject()
            delete request._id // Remove _id (object id) from all sent objects
            requests[i] = request
        }
        res.end(JSON.stringify(requests))
    });
}