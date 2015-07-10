var mongoose = require('mongoose')
var Schema = mongoose.Schema

var detailSchema = new Schema({
	eid: {type:String, required:true},
	title: {type:String, required:true},
	website: {type:String, required:true},
	description: {type:String, required:true},
	price: {type:String, default:'free'},
	currency: {type:String, required:true},
	wid: {type:String, required:true},
	categories: [String],
	other: {}
});

module.exports = mongoose.model('EventDetail', detailSchema)