// Dependencies
var Summary = require('../Schema/eventSummary.js')
var Detail = require('../Schema/eventDetail.js')
var Request = require('../Schema/eventRequest.js')

// Read all available cities from DB
exports.getExistingCities = function (req, res) {
    // Send all available cities to user
    
    var cities = [
        "Austin, TX"
    ]

    res.end(JSON.stringify(cities))
}