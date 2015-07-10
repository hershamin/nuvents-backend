// Dependencies
var huntsman = require('huntsman')
var jsEvaluator = require('eval')
var clientSocket = require('socket.io-client')('http://repo.nuvents.com:1026/')
var moment = require('moment')

// Client socket functions
clientSocket.on('connect', function(){
	console.log('Connected to NuVents backend')
});

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

// Run website, scrap website & add to DB
exports.runWebsite = function(data, socket) {
	// data : JSON data regarding the scraper to test
	// socket : Web socket object involved with this connection

	// Delete previously stored events from this website
	for (var i=0; i<data.eid.length; i++) {
		clientSocket.emit('event:del', {eid:data.eid[i]})
	}

	// Delete previously stored events using website id
	clientSocket.emit('event:del', {wid:data.wid})

	// Listen on events from backend
	clientSocket.on('event:add:status', function (data){
		socket.emit('website:test:status', data);
	});
	clientSocket.on('event:del:status', function (data){
		socket.emit('website:test:status', data);
	});

	var spider = huntsman.spider()

	// Huntsman spider dependencies
	spider.extensions = [
		huntsman.extension('recurse'), // load recurse extension & follow anchor links
		huntsman.extension('cheerio') // load cheerio extension for using CSS selectors
	]

	spider.on('HUNTSMAN_EXIT', function() {
		socket.emit('website:test:status','stop');
	});

	spider.on(new RegExp(data.crawlerRegEx), function (err, res) {

		if (err) { // Found some error
			socket.emit('website:test:progress', 'Error on ' + res.uri)
			return;
		}
		
		var $ = res.extension.cheerio;
		if (!$) {
			socket.emit('website:test:progress', 'No HTML on ' + res.uri)
			return;
		}

		socket.emit('website:test:progress', res.uri) // Send URL parsed

		var eventDetail = {}
		eventDetail.wid = data.wid
		eventDetail.website = res.uri
		eventDetail.websiteName = data.websiteName
		var jsEvalStr = ""

		// collect variables from web page
		for (var i=0; i<data.selectors.length; i++) {
			// useful vars
			htmlAttr = data.selectors[i].htmlAttr
			selector = data.selectors[i].selector
			variable = data.selectors[i].variable
			array = data.selectors[i].array

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
						arrOut[j] = $(arrEl[j]).text().trim();
					}
				}
				scrapedText = JSON.stringify(arrOut);
			} else {
				// Extract html attr. if requested
				if (htmlAttr) {
					scrapedText = $(selector).attr(htmlAttr);
				} else {
					scrapedText = $(selector).text().trim();
				}
			}

			// Go to next iteration if nothing is returned
			if (!scrapedText) {
				jsEvalStr += 'var ' + variable + ' ="";'
			} else {
				scrapedText = scrapedText.replace(/"/g, '\\"') // Excape exclamation marks
				scrapedText = scrapedText.replace(/\n/g, '') // Remove line feed
				scrapedText = scrapedText.replace(/\r/g, '') // Remove return carriage
				scrapedText = scrapedText.replace(/\t/g, '') // Remove tab character
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
				geoText = googleGeocoder(textToGeocode)
				if (geoText == undefined) { continue } // Skip if undefined
				processedText = geoText.lat + ',' + geoText.lng
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
						endM = startM.add(endRaw)
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

			// Send processed text via socket
			if (processedText) {
				socket.emit('website:test:progress', '<b>' + variable + '</b>: ' + processedText)
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
		clientSocket.emit('event:add',eventDetail)

	});

	// Add Hub URLs
	for (var j=0; j<data.hubURL.length; j++) {
		spider.on(data.hubURL[j].url)
	}

	spider.queue.add(data.startWebsite); // Add start Website
	spider.start();
	socket.emit('website:test:status','start');

}