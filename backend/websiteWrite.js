// Dependencies
var Summary = require('../Schema/summary.js');
var Detail = require('../Schema/detail.js');

// Write website to database
exports.writeWebsite = function(req, res, next) {
	
	var summary = new Summary(req.body.scraper)
	req.body.scraperDetail.wid = req.body.scraper.wid // Add Website ID to detail collection
	var detail = new Detail(req.body.scraperDetail)

	summary.save(function(err, summary) {
		if (err) { // Bad request
			res.writeHead(400, {'Content-Type' : 'text/plain'})
			res.end(err.message)
		} else {
			detail.save(function(err, detail) {
				if (err) { // Bad request
					// Remove previously saved summary object & Exit
					var errorDetail = err.message
					Summary.remove({wid: req.body.scraper.wid}, function(err){
						res.writeHead(400, {'Content-Type' : 'text/plain'})
						res.end(errorDetail)
					});
				} else {
					res.writeHead(200, {'Content-Type' : 'text/plain'})
					res.end("Write Complete")
				}
			});
		}
	});

}

// Remove website from database
exports.removeWebsite = function(req, res, next) {
	// Get website ID from request
    // remove website from database
    //   wid : Unique website ID

	Summary.remove({wid: req.params.wid}, function(err) {
		if (err) { // Bad request
			res.writeHead(400, {'Content-Type' : 'text/plain'})
			res.end(err.message)
		} else {
			// Summary removed, now remove detail
			Detail.remove({wid: req.params.wid}, function(err) {
				if (err) { // Bad request
					res.writeHead(400, {'Content-Type' : 'text/plain'})
					res.end(err.message)
				} else {
					res.writeHead(200, {'Content-Type' : 'text/plain'})
					res.end("Website Deleted")
				}
			});
		}
	});

}