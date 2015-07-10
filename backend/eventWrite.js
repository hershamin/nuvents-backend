// Dependencies
var Summary = require('../Schema/summary.js')
var Detail = require('../Schema/detail.js')

// Nearby Events
exports.addEvent = function (socket, data) {
    // Add event to database, includes event summary & event detail
    
    // Summary, then Details
    var summary = new Summary({title: data.title, latitude: parseFloat(data.latitude),
                        longitude: parseFloat(data.longitude), time: JSON.parse(data.time),
                        marker: data.marker, wid: data.wid, media: data.media,
                        websiteName: data.websiteName})
    summary.save(function(err, summary) {
        if (err) { // bad request
            socket.emit('event:add:status', 'Error adding event: ' + err.message);
        } else {
            // Process data before adding to event detail
            delete data.latitude
            delete data.longitude
            delete data.marker
            data.eid = summary.eid
            var requiredParams = ['eid', 'title', 'website', 'description', 'price', 'currency', 'wid', 'categories'];
            // Put non-required fields to the 'other' key
            for (var key in data) {
                if (requiredParams.indexOf(key) < 0) { // Found non-required key
                    if (data.other == undefined) {
                        data.other = {} // Create other field if non-existent
                    }
                    data.other[key] = data[key] // Add attr to non-required obj
                }
            }
            // Save event details
            var detail = new Detail(data)
            detail.save(function(err, detail) {
                if (err) {
                    // Remove previously saved summary object & exit
                    var errorDetail = err.message
                    Summary.remove({_id: summary.eid}, function(err){
                        socket.emit('event:add:status', 'Error adding event: ' + errorDetail);
                    });
                } else {
                    socket.emit('event:add:status', 'Event added: ' + summary.eid);
                }
            });
        }
    });

}

// Event Details
exports.removeEvent = function (socket, data) {
    // Get event ID or website ID from request
    // remove event from database
    //   eid : Unique event ID
    //   wid : Unique Website ID
    //          ID of the website used to get event info

    if (data.eid == undefined && data.wid == undefined) { // no EID or WID found
        socket.emit('event:del:status', 'Error deleting event: no eid or wid specified');
        return;
    }

    var eventRemoveReq = {}
    var widRemoval = true
    if (data.wid != undefined) { // Remove events with Website ID requested
        eventRemoveReq.wid = data.wid
        widRemoval = true
    } else { // Remove event with eventID
        eventRemoveReq._id = data.eid
        widRemoval = false
    }

    Summary.remove(eventRemoveReq, function(err) {
        if (err) { // Error deleting event summary
            socket.emit('event:del:status', 'Error deleting event(s): ' + err.message);
        } else {
            if (!widRemoval) { // Remove event detail using EID instead of WID
                eventRemoveReq.eid = data.eid
                delete eventRemoveReq._id
            }
            Detail.remove(eventRemoveReq, function(err) {
                if (err) { // Error deleting event detail
                    socket.emit('event:del:status', 'Error deleting event(s): ' + err.message);
                } else {
                    socket.emit('event:del:status', 'Event deleted(s): ' + data.eid);
                }
            });
        }
    });

}