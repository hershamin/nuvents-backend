// Dependencies
var Summary = require('../Schema/eventSummary.js')
var Detail = require('../Schema/eventDetail.js')
var EventWrite = require('../backend/eventWrite.js')

// Nearby Events
exports.findNearbyEvents = function (socket, data) {
    // Analyze request for lat,lng,rad
    // respond JSON with events

    // Check if JSON needs to be parsed
    try {
        data = JSON.parse(data);
    } catch (e) {}

    latS = data.lat; // Latitude
    lngS = data.lng; // Longitude
    radS = data.rad; // Search Radius
    timeS = data.time; // Unique unix time stamp (epoch time in seconds) Represents DEVICE TIMESTAMP
    // Device ID: data.did , unique device id for iOS and Android used in determining sessions

    if (data.did == undefined) { // no unique Device ID specified
        socket.emit('event:nearby:status', 'Error getting event summaries: no Device ID specified');
        return;
    }

    if (latS == undefined ||  lngS == undefined || radS == undefined || isNaN(timeS)) {
        socket.emit('event:nearby:status', 'Error getting event summaries: no latitude and/or longitude and/or searchRadius specified');
        return;
    }

    timeStamp = Math.round(parseFloat(timeS)) // Round timestamp and convert to number
    
    // Get GPS points from all corners
    /*
     *     2 *     * 1
     *     
     *          * Given Lat, Lng
     *     
     *     3 *     * 4
     */

    var dist = parseFloat(radS) * Math.sqrt(2) * 1/1000; // Distance in Km
    var brg2 = (45 + 90) * Math.PI/180;
    var brg4 = (45 + 90 + 90 + 90) * Math.PI/180;
    var RadE = 6371.0 // Radius of the earth in Km
    var latGR = parseFloat(latS) * Math.PI/180;
    var lngGR = parseFloat(lngS) * Math.PI/180;
    var lat2R = Math.asin(Math.sin(latGR) * Math.cos(dist/RadE) + 
                    Math.cos(latGR) * Math.sin(dist/RadE) * Math.cos(brg2));
    var lng2R = lngGR + Math.atan2(Math.sin(brg2) * Math.sin(dist/RadE) *
                    Math.cos(latGR), Math.cos(dist/RadE) - Math.sin(latGR) * Math.sin(lat2R));
    var lat4R = Math.asin(Math.sin(latGR) * Math.cos(dist/RadE) +
                    Math.cos(latGR) * Math.sin(dist/RadE) * Math.cos(brg4));
    var lng4R = lngGR + Math.atan2(Math.sin(brg4) * Math.sin(dist/RadE) * 
                    Math.cos(latGR), Math.cos(dist/RadE) - Math.sin(latGR) * Math.sin(lat4R));

    var lat2 = lat2R * 180/Math.PI;
    var lng2 = lng2R * 180/Math.PI;
    var lat4 = lat4R * 180/Math.PI;
    var lng4 = lng4R * 180/Math.PI;


    // Queries to accomplish: lat2 < lat4, lng2 > lng4
        
    // Query and Send to client
    var summStream = Summary.where('latitude').gt(lat2).lt(lat4).where('longitude').gt(lng4).lt(lng2).select('title latitude longitude date eid wid marker time media websiteName').lean().stream();

    summStream.on('data', function (doc) {
        doc.eid = doc._id
        delete doc._id
        // Only send if the event is a future event
        var times = doc.time
        // Sort 'times' array by start time
        times.sort(function (a,b) {
            return parseFloat(a.start) - parseFloat(b.start)
        })
        var toRemove = true
        for (var i=0; i<times.length; i++) {
            if (parseFloat(times[i].start) > parseFloat(timeStamp)) { // Compare EPOCH times
                doc.time = times[i]
                socket.emit('event:nearby', JSON.stringify(doc));
                toRemove = false
                break;
            }
        }
        // Remove event if dates are in the past
        if (toRemove) {
            var removeData = {wid: doc.wid , eid: doc.eid}
            EventWrite.removeEvent(removeData)
            // TODO: trigger event sync from this particular source website (WID)
        }
    });

    summStream.on('error', function (err) {
        socket.emit('event:nearby:status', 'Error getting event summaries');
    });

    summStream.on('close', function () {
        socket.emit('event:nearby:status', 'Event Summaries sent');
    });

}

// Event Details
exports.getEventDetail = function (socket, data, callback) {
    // Get event ID from request
    // respond JSON with details
    //   data.eid : Unique event ID
    // Device ID: data.did , unique device id for iOS and Android used in determining sessions
    // Data is sent back as an acknowledgement using callback() function

    // Check if JSON needs to be parsed
    try {
        data = JSON.parse(data);
    } catch (e) {}

    if (data.did == undefined) { // no unique Device ID specified
        callback('Error getting event details: no Device ID specified');
        return;
    }

    if (data.eid == undefined) { // no EID found
        callback('Error getting event detail: no eid specified');
        return;
    }

    Detail.findOne({eid: data.eid}, function(err, detail) {
        if (detail == null) { // Event does not exist in the db
            callback(JOSN.stringify({error:'Not found on server', eid:data.eid}));
        } else { // Send event details to user
            detail = detail.toObject()
            delete detail._id
            // Move from non-required fields to main fields
            if (detail.other != undefined) {
                for (var key in detail.other) {
                    detail[key] = detail.other[key]
                }
                delete detail.other
            }
            callback(JSON.stringify(detail));
        }
    });

}