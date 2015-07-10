// Dependencies
var Summary = require('../Schema/summary.js');
var Detail = require('../Schema/detail.js');

// Return all websites (summary) to user
exports.allWebsites = function(req, res, next) {
	res.contentType('application/json');

	Summary.find(function(err, summaries) {
		res.end(JSON.stringify(summaries));
	});

}

// Return detail for websiteID to user
exports.websiteDetail = function(req, res, next) {
	res.contentType('application/json');
	var data = {}

	Summary.findOne({wid: req.params.wid}, function(err, summary) {
		data.scraper = summary // Find and append summary object

		Detail.findOne({wid: req.params.wid}, function(err, detail) {
			data.scraperDetail = detail // Find and append detail object

			res.end(JSON.stringify(data))
		});

	});

}

// Return availble Website ID to user
exports.availWID = function(req, res, next) {
	res.writeHead(200, {'Content-Type' : 'text/plain'});
	
	// Returns current max wid incremented
	Summary.findOne().sort('-wid').exec(function(err, summary) {
		if (summary == null) {
			res.end(String(1));
		} else {
			res.end(String(parseInt(summary.wid) + 1));
		}
	});

}