// Send messages to socket
exports.sendMessage = function (did, socket, event, message) {
	// Variables
	//	did: DeviceID
	//	socket: Socket
	//	event: Event such as "event:nearby"
	//	message: Data to send via socket event

	// TEMP Code, send via supplied socket object
	socket.emit(event, message);
}