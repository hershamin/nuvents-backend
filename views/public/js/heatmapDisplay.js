// Request to server to get city requests data.
var xmlhttp = new XMLHttpRequest();
var url = "/requests";

xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        var myArr = JSON.parse(xmlhttp.responseText);
        heatmapFunction(myArr);
        }
};

xmlhttp.open("GET", url, true);
xmlhttp.send();

//Initialize global array to store the latitude and longitude values, function to split the string and convert to float for the google maps api.
var latlng = [];

function heatmapFunction(arr) {
  for (var i = 0; i < arr.length; i++) {
    var lat = (parseFloat(arr[i].latlng.split(',')[0]));
    var lng = (parseFloat(arr[i].latlng.split(',')[1]));
    latlng.push(new google.maps.LatLng(lat,lng));
  }
}

//Initialize the map, add the center, and display the data points on the map.

var map, pointarray, heatmap;

function initialize() {
  var mapOptions = {
    zoom: 5,
    center: new google.maps.LatLng(39.8282, -98.5795),
    mapTypeId: google.maps.MapTypeId.SATELLITE
  };

  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  var pointArray = new google.maps.MVCArray(latlng);

  heatmap = new google.maps.visualization.HeatmapLayer({
    data: pointArray
  });

  heatmap.setMap(map);
}

function toggleHeatmap() {
  heatmap.setMap(heatmap.getMap() ? null : map);
}

function changeGradient() {
  var gradient = [
    'rgba(0, 255, 255, 0)',
    'rgba(0, 255, 255, 1)',
    'rgba(0, 191, 255, 1)',
    'rgba(0, 127, 255, 1)',
    'rgba(0, 63, 255, 1)',
    'rgba(0, 0, 255, 1)',
    'rgba(0, 0, 223, 1)',
    'rgba(0, 0, 191, 1)',
    'rgba(0, 0, 159, 1)',
    'rgba(0, 0, 127, 1)',
    'rgba(63, 0, 91, 1)',
    'rgba(127, 0, 63, 1)',
    'rgba(191, 0, 31, 1)',
    'rgba(255, 0, 0, 1)'
  ];
  heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
}

function changeRadius() {
  heatmap.set('radius', heatmap.get('radius') ? null : 20);
}

function changeOpacity() {
  heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);
}

google.maps.event.addDomListener(window, 'load', initialize);