// Dependencies
var Summary = require('../Schema/eventSummary.js')
var Detail = require('../Schema/eventDetail.js')
var EventWrite = require('../backend/eventWrite.js')
var SocketBuffer = require('../backend/socketBuffer.js')

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
    
    maxDist = (parseFloat(radS)/1000) / 111.12 // Convert distance to degrees using some multiplier
    coords = [parseFloat(lngS), parseFloat(latS)] // Center coordinates
        
    // Query and Send to client
    var summStream = Summary.find({location:{$near:coords, $maxDistance:maxDist}}).select('title location eid wid marker time media websiteName').lean().stream();

    summStream.on('data', function (doc) {
        doc.eid = doc._id
        delete doc._id
        // Split location into latitude & longitude
        doc.latitude = doc.location[1]
        doc.longitude = doc.location[0]
        delete doc.location
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
                SocketBuffer.sendMessage(data.did, socket, 'event:nearby', JSON.stringify(doc));
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
        SocketBuffer.sendMessage(data.did, socket, 'event:nearby:status', 'Error getting event summaries');
    });

    summStream.on('close', function () {
        SocketBuffer.sendMessage(data.did, socket, 'event:nearby:status', 'Event Summaries sent');
    });

}

// Event Details
exports.getEventDetail = function (socket, data) {
    // Get event ID from request
    // respond JSON with details
    //   data.eid : Unique event ID
    // Device ID: data.did , unique device id for iOS and Android used in determining sessions
    // Data is sent back using socket with "event:detail" channel

    // Check if JSON needs to be parsed
    try {
        data = JSON.parse(data);
    } catch (e) {}

    if (data.did == undefined) { // no unique Device ID specified
        socket.emit('event:detail:status', 'Error getting event details: no Device ID specified');
        return;
    }

    if (data.eid == undefined) { // no EID found
        socket.emit('event:detail:status', 'Error getting event detail: no eid specified');
        return;
    }

    Detail.findOne({eid: data.eid}, function(err, detail) {
        if (detail == null) { // Event does not exist in the db
            SocketBuffer.sendMessage(data.did, socket, 'event:detail:status', 'Error getting event detail: Not found on server');
        } else { // Send event details to user
            detail = detail.toObject()
            detail.eid = data.eid
            delete detail._id
            // Move from non-required fields to main fields
            if (detail.other != undefined) {
                for (var key in detail.other) {
                    detail[key] = detail.other[key]
                }
                delete detail.other
            }
            // Merge summary & event detail
            Summary.findOne({_id: data.eid}, function(err, summary) {
                summary = summary.toObject()
                delete summary._id
                for (var key in summary) {
                    detail[key] = summary[key]
                }
                SocketBuffer.sendMessage(data.did, socket, 'event:detail', JSON.stringify(detail));
            });
        }
    });

}