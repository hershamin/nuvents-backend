// Dependencies
var Summary = require('../Schema/summary.js')
var Detail = require('../Schema/detail.js')

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

}