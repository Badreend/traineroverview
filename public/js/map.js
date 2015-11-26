	app.map = {
   	mapDiv: undefined,
   	mapOptions: undefined,
   	locations:'test'
   }


         var hartslagDiv = document.getElementById("temp_heartrate");
      var hartslagTxt = undefined;
	app.map.init = function(){
   	mapDiv = document.getElementById("mapDiv"),
   	mapOptions = {
   		center: new google.maps.LatLng (52.033518, 5.337378),
   		zoom: 1, 
   		disableDefaultUI: true,

   		styles: [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"color":"#000000"},{"lightness":13}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#144b53"},{"lightness":14},{"weight":1.4}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#08304b"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#0c4152"},{"lightness":5}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#0b434f"},{"lightness":25}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},{"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#0b3d51"},{"lightness":16}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"}]},{"featureType":"transit","elementType":"all","stylers":[{"color":"#146474"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#021019"}]}]
   	};

   	app.map.mapObj = new google.maps.Map(mapDiv, mapOptions);
   	app.map.locations = [];
   	app.map.markers = [];
   	locations = app.map.locations;
   	locations.push ({name:"moniek", LatLng: new google.maps.LatLng(52.033318, 5.337372)});
   	locations.push ({name:"inge", LatLng: new google.maps.LatLng(52.035518, 5.337313)});
   	locations.push ({name:"badr", LatLng: new google.maps.LatLng(52.033518, 5.337378)});


   	var iconBase = 'imgs/heads/';
   	app.map.bounds = new google.maps.LatLngBounds();
   	for(var i = 0; i < locations.length;i++){
   		var marker = new google.maps.Marker({
   			position: locations[i].LatLng, 
   			map:app.map.mapObj, 
   			title:locations[i].name,

   			options: {
   				icon: {
   					url: iconBase+locations[i].name+".png",
   					scaledSize: new google.maps.Size(45, 45), 
   				}
   			},
               draggable: true,
    
             Anchor: new google.maps.Point(10, 10),
             labelClass: "label", // the CSS class for the label
   		});         
   		app.map.bounds.extend (locations[i].LatLng);
   	}
   	app.map.markers.push(marker);
   	app.map.mapObj.fitBounds(app.map.bounds);


      var overlay = new CustomMarker(
         new google.maps.LatLng(52.033518, 5.337378), 
         app.map.mapObj,
         {
            marker_id: '123',
            colour: 'Red'
         }
      );

      console.log(overlay.getPosition());





   }//init

   function init(){
   	app.map.init();
   	app.map.markers[0]; 


      //init temp_hartslag

      console.log(app.map.markers[0])




   }

   function update(){
   	requestAnimationFrame(update);
   }

   window.onload = function(){
   	init();
   }
   var dataInputStr = "";

   socket.on('dataClient', function(data){
   	var device_id = parseInt(data.device_id);
   	var lat = parseFloat(data.lat);
   	var lon = parseFloat(data.lon);

   	var heartrate = parseInt(data.heartrate);

   	console.log("id: " + device_id + " - position: " + lat + "  " + lon);
   	console.log("heartrate: " + heartrate);
      hartslagTxt = "Heart rate: " + heartrate;
      hartslagDiv.innerHTML = hartslagTxt; 
   	app.map.markers[0].setPosition( new google.maps.LatLng( lat, lon ) );


   });


