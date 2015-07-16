var app = angular.module('Heatmap', ['ui.bootstrap']);

app.controller('HeatmapController', function($scope, $http) {
	// Initialization function
	var init = function() {
		// Fetch complete list from website
		var response = $http.get('/requests');
		response.success(function(res){
			$scope.heatmap = res;
		});
		response.error(function(res){
			alert("Failure: " + res);
		});
	};
	init();
});