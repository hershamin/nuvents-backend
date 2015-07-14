// Dependencies
var huntsman = require('huntsman')
var scrapeWeb = require('./websiteScrape.js');

// Test website, request is received using web sockets
exports.testWebsite = function(data, socket) {
	// data : JSON data regarding the scraper to test
	// socket : Web socket object involved with this connection

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

		eventDetail = scrapeWeb.scrape($, data, socket, eventDetail) // Scrape HTML

	});

	// Add Hub URLs
	for (var j=0; j<data.hubURL.length; j++) {
		spider.on(data.hubURL[j].url)
	}

	spider.queue.add(data.startWebsite); // Add start Website
	spider.start();
	socket.emit('website:test:status','start');

}