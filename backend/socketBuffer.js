// Send messages to socket
exports.sendMessage = function (socket, event, message) {
	// TEMP Code, send via supplied socket object
	socket.emit(event, message);
}