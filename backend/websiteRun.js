// Dependencies
var huntsman = require('huntsman')
var writeEvents = require('./eventWrite.js');
var scrapeWeb = require('./websiteScrape.js');

// Run website, scrap website & add to DB
exports.runWebsite = function(data, socket) {
	// data : JSON data regarding the scraper to test
	// socket : Web socket object involved with this connection

	var spider = huntsman.spider()

	// Huntsman spider dependencies
	spider.extensions = [
		huntsman.extension('recurse'), // load recurse extension & follow anchor links
		huntsman.extension('cheerio') // load cheerio extension for using CSS selectors
	]

	spider.on('HUNTSMAN_EXIT', function() {
		socket.emit('website:run:status','stop');
	});

	spider.on(new RegExp(data.crawlerRegEx), function (err, res) {

		if (err) { // Found some error
			socket.emit('website:run:progress', 'Error on ' + res.uri)
			return;
		}
		
		var $ = res.extension.cheerio;
		if (!$) {
			socket.emit('website:run:progress', 'No HTML on ' + res.uri)
			return;
		}

		socket.emit('website:run:progress', res.uri) // Send URL parsed

		var eventDetail = {}
		eventDetail.wid = data.wid
		eventDetail.website = res.uri
		eventDetail.websiteName = data.websiteName

		eventDetail = scrapeWeb.scrape($, data, null, eventDetail) // Scrape HTML
		
		writeStatus = writeEvents.addEvent(eventDetail, function (data) {
			socket.emit('website:run:status', data);
		});

	});

	// Add Hub URLs
	for (var j=0; j<data.hubURL.length; j++) {
		spider.on(data.hubURL[j].url)
	}

	spider.queue.add(data.startWebsite); // Add start Website
	spider.start();
	socket.emit('website:run:status','start');

}