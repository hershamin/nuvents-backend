var mongoose = require('mongoose')
var Schema = mongoose.Schema

var summarySchema = new Schema({
	wid: {type:Number, required:'Missing Website ID'},
	title: {type:String, required:'Missing Title'},
	url: {type:String, required:'Missing Website URL'}
});

module.exports = mongoose.model('WebsiteSummary', summarySchema)