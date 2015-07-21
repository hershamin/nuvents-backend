// Dependencies
var jsEvaluator = require('eval')
var moment = require('moment')

// Google geocoding function
function googleGeocoder(address) {
	httpSync = require('httpsync')
	var req = httpSync.request({
		url: "http://maps.googleapis.com/maps/api/geocode/json?address=" + address.replace(/\s/g,"+")
	});
	var res = JSON.parse(req.end().data)

	if (res.results[0] == undefined) {
		return undefined;
	} else {
		return res.results[0].geometry.location;
	}
}

// Scrape website helper function
exports.scrape = function($, data, socket, eventDetail) {

	var jsEvalStr = ""

	// collect variables from web page
	for (var i=0; i<data.selectors.length; i++) {
		// useful vars
		htmlAttr = data.selectors[i].htmlAttr
		selector = data.selectors[i].selector
		variable = data.selectors[i].variable
		array = data.selectors[i].array
		html = data.selectors[i].html

		// Turn variable into array if requested
		var scrapedText;
		if (array) {
			arrEl = $(selector).toArray();
			arrOut = []
			for (var j=0; j<arrEl.length; j++) {
				// Extract html attr. if requested
				if (htmlAttr) {
					arrOut[j] = $(arrEl[j]).attr(htmlAttr);
				} else {
					if (html) { // Extract inner html if requested
						var temp = $(arrEl[j]).html();
						if (temp) { // Trim only if html string is not null
							arrOut[j] = temp.trim();
						} else {
							arrOut[j] = ""
						}
					} else {
						arrOut[j] = $(arrEl[j]).text().trim();
					}
				}
			}
			scrapedText = JSON.stringify(arrOut);
		} else {
			// Extract html attr. if requested
			if (htmlAttr) {
				scrapedText = $(selector).attr(htmlAttr);
			} else {
				if (html) { // Extract inner html if requested
					var temp = $(selector).html();
					if (temp) { // Trim only if html string is not null
						scrapedText = temp.trim();
					} else {
						scrapedText = ""
					}
				} else {
					scrapedText = $(selector).text().trim();
				}
			}
		}

		// Go to next iteration if nothing is returned
		if (!scrapedText) {
			jsEvalStr += 'var ' + variable + ' ="";'
		} else {
			scrapedText = scrapedText.replace(/"/g, '\\"') // Excape exclamation marks
			scrapedText = scrapedText.replace(/\n/g, '') // Remove line feed
			scrapedText = scrapedText.replace(/\\n/g, '') // Remove escaped line feed
			scrapedText = scrapedText.replace(/\r/g, '') // Remove return carriage
			scrapedText = scrapedText.replace(/\\r/g, '') // Remove escaped return carriage
			scrapedText = scrapedText.replace(/\t/g, '') // Remove tab character
			scrapedText = scrapedText.replace(/\\t/g, '') // Remove escaped tab character
			scrapedText = scrapedText.replace(/\\\\/g, '\\') // Replace double escape character with single escape character
			jsEvalStr += 'var ' + variable + ' ="' + scrapedText + '";'
			if (array) { jsEvalStr += variable + ' = JSON.parse(' + variable + ');' }
		}

	}

	// process js string and collect output vars
	rawProcessedObj = jsEvaluator(jsEvalStr + data.jsEval.replace(/\n/g,''))
	outputVars = data.eventAttr.split(',')
	for (var i=0; i<outputVars.length; i++) {
		variable = outputVars[i].trim()
		var processedText

		if (rawProcessedObj[variable] == undefined) { continue } // Skip if undefined

		// Collect vars and geocode if requested
		if (rawProcessedObj[variable].geocode != undefined) { // Intent to geocode
			textToGeocode = rawProcessedObj[variable].geocode.trim();
			textToGeocode = textToGeocode.replace(/\s\s+/g, '');
			if (socket) { // Socket variable is set (called from websiteTest.js)
				processedText = 'GEOCODE: ' + textToGeocode
			} else { // Socket variable not set (called from websiteRun.js)
				geoText = googleGeocoder(textToGeocode)
				if (geoText == undefined) { continue } // Skip if undefined
				processedText = geoText.lat + ',' + geoText.lng
			}
		} else if (variable == 'time') { // Intent to use momentJS (http://momentjs.com/)
			var timeRaw = []
			if (Array.isArray(rawProcessedObj.time)) {
				timeRaw = rawProcessedObj.time
			} else {
				timeRaw[0] = rawProcessedObj.time
			}
			var eventTS = [] // Event timestamps
			currentTS = Date.now() / 1000 | 0 // Current timestamp in EPOCH
			for (var j=0; j<timeRaw.length; j++) { // Iterate through acquired start and end times to get EPOCH timestamps
				startRaw = timeRaw[j].start
				endRaw = timeRaw[j].end
				startM = moment(startRaw[0], startRaw[1])
				startTS = Date.parse(startM._d.toString())/1000
				var endM
				if (endRaw.endOf != undefined) {
					endM = startM.endOf(endRaw.endOf)
				} else {
					duration = moment.duration(endRaw)
					endM = startM.add(duration)
				}
				endTS = Date.parse(endM._d.toString())/1000
				if (startTS > currentTS) { // Only add to DB if start time is in the future
					eventTS.push({start: startTS, end: endTS})
				}
			}
			processedText = JSON.stringify(eventTS)
		} else {
			processedText = rawProcessedObj[variable].trim()
		}

		// Send processed text via socket if not nil
		if (processedText) {
			if (socket) { socket.emit('website:test:progress', '<b>' + variable + '</b>: ' + processedText) }
			if (variable == 'location') {
				eventDetail.latitude = processedText.split(',')[0]
				eventDetail.longitude = processedText.split(',')[1]
			} else if (variable == 'categories') {
				eventDetail.categories = processedText.split(',')
			} else {
				eventDetail[variable] = processedText
			}
		}
	}

	eventDetailTemp = JSON.stringify(eventDetail)
	eventDetail = JSON.parse(eventDetailTemp)

	return eventDetail

}