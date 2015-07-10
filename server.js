// Initialization
var express = require('express')
var app = express()

// socket.io configuration
var httpServerIO = require('http').Server(app)
var io = require('socket.io')(httpServerIO)

// RedisDB
var redis = require('redis');
var rClient = redis.createClient();

// MongoDB
var mongoConnURI = 'mongodb://localhost:27017/nuvents'
var mongoose = require('mongoose')
mongoose.connect(mongoConnURI)

// Routing Dependencies
var deviceInit = require('./backend/deviceInitial.js');
var readEvents = require('./backend/eventRead.js');
var writeEvents = require('./backend/eventWrite.js');
var eventWeb = require('./backend/eventWebsite.js');
var eventReq = require('./backend/eventRequest.js');

// Real-time routing
io.on('connection', function (socket) {

	// Updating client on resources
	socket.on('device:initial', function (data) {
		deviceInit.sendResources(socket, data, rClient);
	});

	// Routing event requests from client
	socket.on('event:nearby', function (data) { // Client requested nearby events
		readEvents.findNearbyEvents(socket, data, rClient);
	});
	socket.on('event:detail', function (data, callback) { // Client requested event detail
		readEvents.getEventDetail(socket, data, rClient, callback);
	});

	// Routing event requests from updater
	socket.on('event:add', function (data) { // Updater wants to add event to DB
		writeEvents.addEvent(socket, data);
	});
	socket.on('event:del', function (data) { // updater wants to delete event from DB
		writeEvents.removeEvent(socket, data);
	});

	// Server-Client pinging
	socket.on('ping', function (data) {
		socket.emit('pong', data);
	});

	// Event website status
	socket.on('event:website', function (data) {
		eventWeb.eventStatus(socket, data, rClient);
	});

	// Events request to add city
	socket.on('event:request', function (data) {
		eventReq.eventRequest(socket, data, rClient);
	});

});

// Initiate Server
httpServerIO.listen(1026);
console.log("Listening on Port 1026")
console.log("MongoDB on " + mongoConnURI)
console.log("RedisDB on localhost:6379")