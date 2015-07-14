﻿// Dependencies
var Summary = require('../Schema/eventSummary.js')
var Detail = require('../Schema/eventDetail.js')
var Request = require('../Schema/eventRequest.js')

// Event request to add city
exports.eventRequest = function (socket, data) {
	// Convert raw data string into json
	var rawStr = data.replace('?','').replace(/\%20/g,' ').split('&')
	var data = {}
	for (var i=0; i<rawStr.length; i++) {
		strSpl = rawStr[i].split('=')
		data[strSpl[0]] = strSpl[1]
	}

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