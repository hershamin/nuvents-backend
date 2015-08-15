var mongoose = require('mongoose')
var Schema = mongoose.Schema

// Website selector sub schema, prevent _id from being created
var selectorSubSchema = new Schema({
	selector: String,
	htmlAttr: String,
	variable: String,
	array: Boolean,
	html: Boolean
}, {_id:false});

var detailSchema = new Schema({
	wid: {type:Number, required:'Missing Website ID'},
	startWebsite: {type:String, required:'Missing Start Website'},
	hubURL: [{
		url: String
	}],
	crawlerRegEx: {type:String, required:'Missing Crawler Regular Expression'},
	selectors: [selectorSubSchema],
	eventAttr: String,
	jsEval: String,
	eid: [String]
});

module.exports = mongoose.model('WebsiteDetail', detailSchema)