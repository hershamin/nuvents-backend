var mongoose = require('mongoose')
var Schema = mongoose.Schema

var socketSchema = new Schema({
	event : {type:String, required:true},
	message : {type:String, required:true},
	did : {type:String, required:true},
	expireAt : { // Field to expire document
		type: Date,
		required: true,
		default: Date.now()
	}
});

// Expire 30 mins after the indicated time in expireAt field
socketSchema.index({expireAt: 1}, {expireAfterSeconds: 30 * 60});

module.exports = mongoose.model('SocketBuffer', socketSchema)