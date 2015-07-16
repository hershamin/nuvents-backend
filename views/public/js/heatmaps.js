var myApp = angular.module('HeatmapApp', []);

myApp.controller('HeatmapController', ['$scope', '$http', function($scope, $http) {
		// Fetch complete list from website
		var response = $http.get('/requests');
		response.success(function(res){
			$scope.heatmap = res;
		});
		response.error(function(res){
			alert("Failure: " + res);
		});
}]);