// Send device resources manifest as JSON
exports.sendResources = function(socket, data, callback) {
	// Get Device ID (did) and Device Model (dm)
	//	Data is sent back using "resources" or "resources:status" event

	// Check if JSON needs to be parsed
    try {
        data = JSON.parse(data);
    } catch (e) {}

	if (data.did == undefined || data.dm == undefined) { // Insufficient information
		callback("Error getting resources: device ID and/or device Model not specified");
		return;
	}

	// Read JSON from file
	var fs = require('fs')
	var jsonStr = fs.readFile('./resources.json', 'utf8');
	callback(jsonStr)

}