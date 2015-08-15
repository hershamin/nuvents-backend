var mongoose = require('mongoose')
var Schema = mongoose.Schema

var summarySchema = new Schema({
	title: {type:String, required:true},
	location: {
		type: [Number],	// [<longitude>, <latitude>]
		index: '2d',	// create the geospatial index
		required: true
	},
	time: [{start:Number, end:Number}],
	wid: {type:String, required:true},
	marker: {type:String, default:'default'},
	media: {type:String, required:true},
	website: {type:String, required:true},
	websiteName: {type:String, required:true}
});

// The code below is equivalent to adding
// 						eid: {type:String, required:true}
//		in the above summarySchema object
summarySchema.virtual('eid').get(function() {
	return this._id;
});

// The code below validates the size of 'time' attribute for event
//		The array cannot be empty
summarySchema.path('time').validate(function (value) {
	return value.length
}, "'time' cannot be an empty array")

module.exports = mongoose.model('EventSummary', summarySchema)