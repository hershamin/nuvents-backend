var app = angular.module('NuVents-Scraper', ['ui.bootstrap','ui.ace']);

// Main Controller
app.controller('scrapeController', function($scope, $modal, $http) {
	// Initialization function
	var init = function() {
		// Fetch complete list from website
		var response = $http.get('/website');
		response.success(function(res){
			$scope.scrapingSites = res;
		});
		response.error(function(res){
			alert("Failure: " + res);
		});
	};
	init();

	$scope.newSite = function() {
		// Present new site configuration interface
		var modalInstance = $modal.open({
			templateUrl: 'scrapeDetailUI.html',
			controller: 'scrapeDetailCtrl',
			windowClass: 'scraperModalWindow',
			backdrop: 'static',
			keyboard: false,
			resolve: {
				wid: function() {
					return 'new';
				}
			}
		});

		modalInstance.result.then(function() {
			// Refresh Site List
			init();
		}, function() {});
	}

	$scope.editSite = function(wid) {
		// Present edit site configuration interface
		var modalInstance = $modal.open({
			templateUrl: 'scrapeDetailUI.html',
			controller: 'scrapeDetailCtrl',
			windowClass: 'scraperModalWindow',
			backdrop: 'static',
			keyboard: false,
			resolve: {
				wid: function() {
					return wid;
				}
			}
		});

		modalInstance.result.then(function() {
			// Refresh Site List
			init();
		}, function() {});
	}
	
});