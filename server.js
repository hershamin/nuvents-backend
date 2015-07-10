// Initialization
var express = require('express')
var app = express()
var listenPort = process.env.PORT || 1027

// socket.io configuration
var httpServerIO = require('http').Server(app)
var io = require('socket.io')(httpServerIO)

// MongoDB
var mongoConnURI = 'mongodb://localhost:27017/nuvents'
var mongoose = require('mongoose')
mongoose.connect(mongoConnURI)

// Set up static web server + jade templating
var path = require('path');
app.use(express.static(path.join(__dirname, 'views', 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Misc express settings
app.set('x-powered-by', false);

// Set up support for http post methods
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// Routing Dependencies
var deviceInit = require('./backend/deviceInitial.js');
var readEvents = require('./backend/eventRead.js');
var eventWeb = require('./backend/eventWebsite.js');
var eventReq = require('./backend/eventRequest.js');
var websiteRead = require('./backend/websiteRead.js'); // For website information requests
var websiteWrite = require('./backend/websiteWrite.js'); // For website writing requests
var websiteTest = require('./backend/websiteTest.js'); // For website testing requests
var websiteRun = require('./backend/websiteRun.js'); // For website running requests

// Main page, render index.jade page
app.get('/', function(req, res, next){ res.render('scrapers'); });

// Serve information requests
app.get('/website', websiteRead.allWebsites);
app.get('/website/:wid', websiteRead.websiteDetail);
app.get('/info/availID', websiteRead.availWID);

// Writing and Removing website requests
app.post('/website', websiteWrite.writeWebsite);
app.delete('/website/:wid', websiteWrite.removeWebsite);

// Real-time routing
io.on('connection', function (socket) {

	// Updating client on resources
	socket.on('device:initial', function (data) {
		deviceInit.sendResources(socket, data);
	});

	// Routing event requests from client
	socket.on('event:nearby', function (data) { // Client requested nearby events
		readEvents.findNearbyEvents(socket, data);
	});
	socket.on('event:detail', function (data, callback) { // Client requested event detail
		readEvents.getEventDetail(socket, data, callback);
	});

	// Server-Client pinging
	socket.on('ping', function (data) {
		socket.emit('pong', data);
	});

	// Event website status
	socket.on('event:website', function (data) {
		eventWeb.eventStatus(socket, data);
	});

	// Events request to add city
	socket.on('event:request', function (data) {
		eventReq.eventRequest(socket, data);
	});

	// Testing website scraper
	socket.on('website:test', function (data) { // Server received scraper json
		websiteTest.testWebsite(data, socket);
	});

	// Adding events to DB using web scraper
	socket.on('website:run', function (data) {
		websiteRun.runWebsite(data, socket);
	});

});

// Initiate Server
httpServerIO.listen(listenPort);
console.log("Listening on Port " + listenPort)
console.log("MongoDB on " + mongoConnURI)