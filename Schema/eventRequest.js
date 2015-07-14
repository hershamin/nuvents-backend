var mongoose = require('mongoose')
var Schema = mongoose.Schema

var requestSchema = new Schema({
	city: {type:String, required:'Missing City Name'},
	state: {type:String, required:'Missing State Abbr.'},
	zip: {type:Number, required:'Missing Zip Code'},
	email: {type:String, required:'Missing Email'},
	name: {type:String, required:'Missing Name'},
	latlng: {type:String, required:'Missing Request Coordinates'},
	did: {type:String, required:'Missing Unique Device ID'},
	timestamp: {type:Number, required:'Missing Timestamp in EPOCH'}
});

module.exports = mongoose.model('EventRequest', requestSchema)