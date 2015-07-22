var mongoose = require('mongoose')
var Schema = mongoose.Schema

var detailSchema = new Schema({
	wid: {type:Number, required:'Missing Website ID'},
	startWebsite: {type:String, required:'Missing Start Website'},
	hubURL: [{
		url: String
	}],
	crawlerRegEx: {type:String, required:'Missing Crawler Regular Expression'},
	selectors: [{
		selector: String,
		htmlAttr: String,
		variable: String,
		array: Boolean,
		html: Boolean
	}],
	eventAttr: String,
	jsEval: String,
	eid: [String]
});

module.exports = mongoose.model('WebsiteDetail', detailSchema)