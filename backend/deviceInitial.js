// Send device resources manifest as JSON
exports.sendResources = function(socket, data, rClient) {
	// Get Device ID (did) and Device Model (dm)
	//	Data is sent back using "resources" or "resources:status" event

	// Check if JSON needs to be parsed
    try {
        data = JSON.parse(data);
    } catch (e) {}

	if (data.did == undefined || data.dm == undefined) { // Insufficient information
		socket.emit("resources:status", "Error getting resources: device ID and/or device Model not specified");
		return;
	}

	// JSON data to send
	var toSend = {
		md5sum : {
			marker : {
				default : '95299637708a948f3be8c85b0e91ae5f',
				cluster : 'd0e3b800638f44b3b6be01bec9b768aa',
				charity : '07a534b34206ff7219cab8a7f555ba11',
				conference : '5734613de496a90cea46fa65ed2e8fba',
				food : '9cf7f066eb5be59bec226056c2b4685f',
				music : '099e84a1fa82ec00ad28680fe86e2f98',
				productLaunch : '586739fb70963a933eca70cdb8bbc7cd',
				sports : '5529aca2eefbaff1f103c9a40527edd0'
			},
			welcomeViewImgs : {
				bg1 : 'a0420fe87bbefb09f97370b0619acbc1',
				bg2 : '96286786620b5efbff35ceef635ad02b',
				bg3 : '8be68cb3addb0e2ab63254ae7be5528b',
				bg4 : '4b567c12aa5f798553b8678c5483ede8',
				bg5 : 'f1a650401ea23610e0948f0eb1f74911' 
			}
		},
		resource : {
			marker : {
				default : 'http://storage.googleapis.com/nuvents-resources/defaultEvent.png',
				cluster : 'http://storage.googleapis.com/nuvents-resources/clusterEvent.png',
				charity : 'http://storage.googleapis.com/nuvents-resources/charityEvent.png',
				conference : 'http://storage.googleapis.com/nuvents-resources/conferenceEvent.png',
				food : 'http://storage.googleapis.com/nuvents-resources/foodEvent.png',
				music : 'http://storage.googleapis.com/nuvents-resources/musicEvent.png',
				productLaunch : 'http://storage.googleapis.com/nuvents-resources/productLaunchEvent.png',
				sports : 'http://storage.googleapis.com/nuvents-resources/sportsEvent.png'
			},
			welcomeViewImgs : {
				bg1 : 'http://storage.googleapis.com/nuvents-resources/welcomeViewImgs/bg1.png',
				bg2 : 'http://storage.googleapis.com/nuvents-resources/welcomeViewImgs/bg2.png',
				bg3 : 'http://storage.googleapis.com/nuvents-resources/welcomeViewImgs/bg3.png',
				bg4 : 'http://storage.googleapis.com/nuvents-resources/welcomeViewImgs/bg4.png',
				bg5 : 'http://storage.googleapis.com/nuvents-resources/welcomeViewImgs/bg5.png'
			}
		}
	}

	// Remove client from redis to add new entry to keep track of Event IDs of the client
	rClient.del(data.did + ':eid', function (err, reply) {
		if (err) {
			socket.emit("resources:status", "Error getting resources: unable to add client session")
		} else {
			socket.emit("resources", JSON.stringify(toSend));
			socket.emit("resources:status", "Resources sent");
		}
	});

}