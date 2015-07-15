var app = angular.module('NuVents-Scraper');

// Controller for New scraper popup
app.controller('scrapeDetailCtrl', function($scope, $modalInstance, wid, $http, $sce) {
	// Setup data model
	$scope.detailUI = {
		removeWebsiteBtn: false,
		testPlaceholder : 'press "test" to validate the scraper detail',
		closeDetailBtn: true,
		runBtn: false
	}

	// Determine the socket connection url based on host
	$scope.socketConn = window.location.href.split('/').splice(0,3)
	$scope.socketConn = $scope.socketConn.join('/') + '/'

	// called when ace JS editor is loaded
	$scope.aceLoaded = function(editor) {
		editor.getSession().setUseWrapMode(true);
		editor.getSession().setMode('ace/mode/javascript')
	}

	var initWebTester = function() {
		$scope.testDataHtml = $sce.trustAsHtml('<li class="list-group-item">' + $scope.detailUI.testPlaceholder + '</li>')
		$scope.testData = ''
	}
	initWebTester();

	$scope.scraper = {
		title: "",
		url: "",
		wid: ""
	}

	$scope.scraperDetail = {
		startWebsite: "",
		hubURL: [{
			url: ""
		}],
		crawlerRegEx: "",
		selectors:[{
			selector: "",
			htmlAttr: "",
			variable: "",
			array: "",
			html: ""
		}],
		eventAttr: "",
		jsEval: "",
		eid: []
	}

	// Initialization function
	var init = function() {
		if (wid == 'new') { // If new website ui is requested
			// Prepare ui for new website
			// Get available Website ID
			var response = $http.get('/info/availID');
			response.success(function(res) {
				$scope.scraper.wid = res;
				$scope.detailUI.removeWebsiteBtn = false;
			});
			response.error(function(res) {
				alert("Error: " + res);
			});
			$scope.scraperDetail.hubURL.splice(0, 1);
			$scope.scraperDetail.selectors.splice(0, 1);
		} else {
			// Load website info and prepare UI
			var response = $http.get('/website/' + wid);
			response.success(function(res){
				$scope.scraper = res.scraper;
				$scope.scraperDetail = res.scraperDetail;
				$scope.detailUI.removeWebsiteBtn = true;
			});
			response.error(function(res){
				alert("Error: " + res);
			});
		}
	};
	init();

	$scope.addField = function(index, field) {
		if (field == 'hubURLs') {
			$scope.scraperDetail.hubURL.splice(index + 1, 0, {url: ""});
		} else if (field == 'selectors') {
			$scope.scraperDetail.selectors.splice(index + 1, 0, {selector:"", htmlAttr:"", variable:"", array:false, html:false})
		}
	}

	$scope.removeField = function(index, field) {
		if (field == 'hubURLs') {
			$scope.scraperDetail.hubURL.splice(index, 1);
		} else if (field == 'selectors') {
			$scope.scraperDetail.selectors.splice(index, 1);
		}
	}

	$scope.test = function() { // To test current scraper
		initWebTester(); // Clear test data objects
		var socket = io.connect($scope.socketConn)
		$scope.scraperDetail.wid = $scope.scraper.wid // Add website id to scraper detail
		$scope.scraperDetail.websiteName = $scope.scraper.title // Add website name to scraper detail
		socket.emit('website:test', $scope.scraperDetail) // Send scraper data for request
		socket.on('website:test:progress', function(data) { // Receive test data from server
			$scope.$apply(function() {
				if (data.substring(0,4) == 'http') {
					$scope.testData += '<li class="list-group-item">' + data + '</li>'
				} else {
					$scope.testData += '<li class="list-group-item">&nbsp&nbsp&nbsp&nbsp' + data + '</li>'
				}
				$scope.testDataHtml = $sce.trustAsHtml($scope.testData)
			});
		});
		socket.on('website:test:status', function(data) {
			var currStatus;
			if (data.indexOf('start') > -1) { // Spider starts
				$scope.$apply(function() {
					$scope.testData += '<li class="list-group-item"><b style="color:#0000FF">Web crawer started...</b></li>'
					$scope.testDataHtml = $sce.trustAsHtml($scope.testData)
				});
			} else if (data.indexOf('stop') > -1) { // Spider ends
				$scope.$apply(function() {
					$scope.testData += '<li class="list-group-item"><b style="color:#FF0000">Web crawler stopped...</b></li>'
					$scope.testDataHtml = $sce.trustAsHtml($scope.testData)
					$scope.detailUI.runBtn = true
				});
			} else if (data.indexOf('added') > -1) { // Spider added event to DB
				$scope.$apply(function() {
					$scope.scraperDetail.eid.push(data.split(':')[1].trim())
					$scope.detailUI.closeDetailBtn = false
				});
			} else if (data.indexOf('deleted') > -1) { // Spider removed event from DB
				$scope.$apply(function() {
					var ind = $scope.scraperDetail.eid.indexOf(data.split(':')[1].trim())
					if (ind > -1) { $scope.scraperDetail.eid.splice(ind, 1) }
					$scope.detailUI.closeDetailBtn = false
				});
			}
		});
		socket.on('disconnect', function() {
			alert("Disconnected from test instance")
		});
	}

	$scope.run = function() { // To run current scraper
		initWebTester(); // Clear test data objects
		var socket = io.connect($scope.socketConn)
		$scope.scraperDetail.wid = $scope.scraper.wid // Add website id to scraper detail
		$scope.scraperDetail.websiteName = $scope.scraper.title // Add website name to scraper detail
		socket.emit('website:run', $scope.scraperDetail) // Send scraper data for request
		socket.on('website:run:progress', function(data) { // Receive test data from server
			$scope.$apply(function() {
				if (data.substring(0,4) == 'http') {
					$scope.testData += '<li class="list-group-item">' + data + '</li>'
				} else {
					$scope.testData += '<li class="list-group-item">&nbsp&nbsp&nbsp&nbsp' + data + '</li>'
				}
				$scope.testDataHtml = $sce.trustAsHtml($scope.testData)
			});
		});
		socket.on('website:run:status', function(data) {
			var currStatus;
			if (data.indexOf('start') > -1) { // Spider starts
				$scope.$apply(function() {
					$scope.testData += '<li class="list-group-item"><b style="color:#0000FF">Web crawer started...</b></li>'
					$scope.testDataHtml = $sce.trustAsHtml($scope.testData)
				});
			} else if (data.indexOf('stop') > -1) { // Spider ends
				$scope.$apply(function() {
					$scope.testData += '<li class="list-group-item"><b style="color:#FF0000">Web crawler stopped...</b></li>'
					$scope.testDataHtml = $sce.trustAsHtml($scope.testData)
					$scope.detailUI.runBtn = true
				});
			} else if (data.indexOf('added') > -1) { // Spider added event to DB
				$scope.$apply(function() {
					$scope.scraperDetail.eid.push(data.split(':')[1].trim())
					$scope.detailUI.closeDetailBtn = false
				});
			} else if (data.indexOf('deleted') > -1) { // Spider removed event from DB
				$scope.$apply(function() {
					var ind = $scope.scraperDetail.eid.indexOf(data.split(':')[1].trim())
					if (ind > -1) { $scope.scraperDetail.eid.splice(ind, 1) }
					$scope.detailUI.closeDetailBtn = false
				});
			}
		});
		socket.on('disconnect', function() {
			alert("Disconnected from backend")
		});
	}

	$scope.ok = function() {
		// Save scraper to database
		var data = {
			scraper: $scope.scraper,
			scraperDetail: $scope.scraperDetail
		}
			
		var response = $http.post('/website',JSON.stringify(data));
		response.success(function(res){
			$modalInstance.close();
		});
		response.error(function(res){
			alert("Error Saving: " + res);
		});

	}

	$scope.update = function() {
		var data = {
			scraper: $scope.scraper,
			scraperDetail: $scope.scraperDetail
		}
		var response = $http.delete('/website/' + $scope.scraper.wid);
		response.success(function(res){
			var response1 = $http.post('/website', JSON.stringify(data));
			response1.success(function(res){
				$modalInstance.close();
			});
			response1.error(function(res){
				alert("Error Updating: " + res);
			});
		});
		response.error(function(res){
			alert("Error Updating: " + res);
		});
	}

	$scope.remove = function() {
		// Remove scraper from database
		var response = $http.delete('/website/' + $scope.scraper.wid)
		response.success(function(res){
			$modalInstance.close();
		});
		response.error(function(res){
			alert("Error Removing: " + res);
		});
	}

	$scope.close = function() {
		$modalInstance.dismiss('cancel');
	}
});