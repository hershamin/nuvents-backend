var app = angular.module('HeatmapApp',[]);

app.controller('HeatmapController', function($scope, $http) {
		// Fetch complete list from website
		var response = $http.get('/requests');
		response.success(function(res){
			$scope.heatmap = res;
		});
		response.error(function(res){
			alert("Failure: " + res);
		});
});
