// Dependencies
var SocketBuffer = require('../Schema/socketBuffer.js');

// Send messages to socket
exports.sendMessage = function (did, socket, event, message) {
	// Variables
	//	did: DeviceID
	//	socket: Socket
	//	event: Event such as "event:nearby"
	//	message: Data to send via socket event

	// Add message to DB buffer
	var buffer = new SocketBuffer({did: did, event: event, message: message});
	buffer.save(function (err, buff) {
		// Send via supplied socket object via acknowledgement
		socket.emit(event, message, function (data) {
			// Data is received on client end, remove from buffer
			SocketBuffer.remove({did: did, event: event, message: message});
		});
	});

}

// Retrieve messages & send to socket
exports.retrieveMessage = function(data, socket) {
	// Variables
	//	data.did: DeviceID
	//	data.dm: DeviceModel
	//	socket: Socket

	if (data.did == undefined || data.dm == undefined) {
		return; // Required information not specified
	}

	// Get messages from DB buffer
	SocketBuffer.find({did: data.did}, 'did event message', function (err, messages) {
		// Send missed messages
		for (var i=0; i<messages.length; i++) {
			var mess = messages[i].toObject()
			socket.emit(mess.event, mess.message, function (data) {
				// Data is received on client end, remove from buffer
				SocketBuffer.remove({did: data.did, event: mess.event, message: mess.message});
			});
		}
	});
}