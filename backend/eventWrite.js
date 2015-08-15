// Dependencies
var Summary = require('../Schema/eventSummary.js')
var Detail = require('../Schema/eventDetail.js')
var WebsiteDetail = require('../Schema/websiteDetail.js')

// Add Event to DB
exports.addEvent = function (data, callback) {
    // Add event to database, includes event summary & event detail
    
    // Summary, then Details
    var summary = new Summary({title: data.title, location: [parseFloat(data.longitude),
                        parseFloat(data.latitude)], time: JSON.parse(data.time),
                        marker: data.marker, wid: data.wid, media: data.media, website: data.website,
                        websiteName: data.websiteName})
    summary.save(function(err, summary) {
        if (err) { // bad request
            callback('Error adding event: ' + err.message)
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
                        callback('Error adding event: ' + errorDetail)
                    });
                } else {
                    callback('Event added: ' + summary.eid)
                }
            });
        }
    });

}

// Remove Event from DB
exports.removeEvent = function (data) {
    // Get event ID or website ID from request
    // remove event from database
    //   eid : Unique event ID
    //   wid : Unique Website ID
    //          ID of the website used to get event info

    if (data.eid == undefined || data.wid == undefined) { // no EID or WID found
        return
    }

    // Remove event summary
    Summary.remove({_id: data.eid, wid: data.wid}, function(err) {
        if (err) { // Error deleting event summary
            return
        } else {
            // Remove event detail
            Detail.remove({eid: data.eid, wid: data.wid}, function(err) {
                if (err) { // Error deleting event detail
                    return
                } else {
                    // Remove record from website detail
                    WebsiteDetail.update({wid: data.wid}, {$pull:{eid: data.eid}})
                    return
                }
            });
        }
    });

}