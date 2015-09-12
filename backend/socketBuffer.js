// Dependencies
var SocketBuffer = require('../backend/socketBuffer.js');

// Send messages to socket
exports.sendMessage = function (did, socket, event, message) {
	// Variables
	//	did: DeviceID
	//	socket: Socket
	//	event: Event such as "event:nearby"
	//	message: Data to send via socket event

	// Add message to DB buffer
	var buffer = new SocketBuffer({did: did, event: event, message: message});
	buffer.save();

	// Send via supplied socket object via acknowledgement
	socket.emit(event, message, function (data) {
		// Data is received on client end, remove from buffer
		SocketBuffer.remove({did: did, event: event, message: message});
	});
}