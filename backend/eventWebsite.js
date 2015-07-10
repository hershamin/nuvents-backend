// Dependencies
var Summary = require('../Schema/eventSummary.js')
var Detail = require('../Schema/eventDetail.js')

// Event Websites
exports.eventStatus = function (socket, data) {
    // Analyze request event link and status code

    // Check if JSON needs to be parsed
    try {
        data = JSON.parse(data);
    } catch (e) {}

    webS = data.website; // Website
    sCod = data.respCode; // Status Code
    // Website: data.website, link where a particular event was scraped
    // Status Code: data.respCode, Http response status code from that link

    if (webS == undefined || sCod == undefined) { // no specified
        socket.emit('event:website:status', 'Error processing event website response: no website and/or response code specified');
        return;
    }

    // TODO: Process event status code returned from devices

}