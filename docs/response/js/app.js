(function () {

    'use strict';

    // creates an angular module called  - bound to body through ng-app directive
    var app = angular.module('anti_park_spwa', ['angular-uuid', 'monospaced.qrcode']);

    // creating controller
    app.controller('Main', control);

    // Inject the $http service. Need $http to make HTTP requests to the API
    control.$inject = ['$http', 'uuid'];

    // Pass any injected services to the controller constructor function
    function control($http, uuid) {

        var vm = angular.extend(this, {
            title: 'Welcome to the Sticker App',
            stickers: [],
            events: [],
            endpoint: '',
            hasResponded: false,
            giveThanks: false,
            hasparams:false,

            //new code
        //add scanner object to data model
        scanner: new Instascan.Scanner({
            video: document.getElementById('qr-video'),
            continious: true,
            scanPeriod: 5,
            backgroundScan: false,
            refactoryPeriod: 3000
        })
        });
        

        var urlParams = new URLSearchParams(window.location.search);
        var sticker_uuid = urlParams.get('uuid'); //gets uuid from url



        

        //if there are no parameters in the url
        if(sticker_uuid==null)
        {
            vm.hasResponded=true;   //hide the response buttons
            vm.hasParams=false;     //show the scanner button
        }
        else
        {
            vm.hasParams=true;      //hide the scanner button
            vm.hasResponded=false;  //show the response button
        }
        vm.scanner.addListener('scan',function(content)
        {
            vm.scanner.stop();//stop the scanner when a code is scanned
            console.log(content);//display the scanned code in the log
            window.location.href=content;//redirect to the link from the code (should be the response page again but this time with parameters)
        });

        vm.scanQRcode=function(){
            //get a camera, pass it into the start of the scanner object in the data model (defined above)
            //this will start the camera, show the video feed on the page and start scanning for a QRcode
            Instascan.Camera.getCameras().then(function(cameras){
                //enumerate available cameras. result displayed in an array
                if(cameras.length>0)//if any cameras are found
                {
                    if(cameras.length==1)//check if there is only one camera
                    {
                        vm.scanner.start(cameras[0]);
                        console.log("started scanner");
                    }
                    else{ //if there is more than one camera open the rear/back camera
                        vm.scanner.start(cameras[1]);
                        console.log("started scanner");
                    }
                }
                else{
                    console.error("No cameras found.");
                } 
            }).catch(function (e){
                console.error(e);
            });
        }

        vm.init = function () {
            // get the endpoint from the config file
            $http.get('config.json').then(
                function success(response) {
                    vm.endpoint = response.data.endpoint; //set the endpoint
                    console.info(response.data); //display the endpoint in the log
                    
                },
                function failure(err) {
                    console.error(err);
                }
            )
        }


        vm.apologise = function () {
            var z = true;
            var urlParams = new URLSearchParams(window.location.search);//make urlParams a variable with the parameters from the url in it
            var sticker_uuid = urlParams.get('uuid'); //gets uuid from url
            var parkapi = "https://" + urlParams.get('parkapi') + ".com/"; //gets park api from urlParams
            

            var responsejson = { "has_apologised": true, "sticker_uuid": sticker_uuid, "apologyRec": true, "apologyPN": 1 }; //creates the response json string
            var apologisePayload= "The terrible horrible parking man said hes very sory for putting your life in danger";

            //Use $http service to send get request to API and execute different functions depending on whether it is successful or not

            //creates the response payload to send to the parkapi to create a push notification response to the user who reported the incident
            var responsePayload = {   
                "recipient_id":"/topics/"+sticker_uuid,   
                "sender_id": "",   
                "message_id": "",   
                "message_type": 0,   
                "sender_role": 0,   
                "payload": "{\"RESPONSE\":\"The terrible, horrible parking man has apologised for putting your life in danger\"}"
            };
            //sends the payload to the api
            vm.sendPayload(responsePayload).then(
                function success(response) {
                    $http.post(parkapi + 'responses/', JSON.stringify(responsejson))     //sends the payload to the api
                        .then(
                            function success(response) {
                                vm.responses = response.data;
                                vm.hasResponded = true;//hides the buttons
                                vm.giveThanks = true;//shows the thankyou message
                                console.info(response);//shows the server response to the user
                            },
                            function failure(err) {
                                console.error(err);//shows error in console
                            })
                },
                function failure(err) {
                    alert("fcm down! whoops!");//if the message fails to send, displays an alert
                    console.log(err);
                });
            //)

        };//get UUIDshould change apologyRec to true; change apologyPN to 1






        vm.refuse = function ()//should change apologyRec to true; change apologyPN to -1
        {
            var z = true;
            var urlParams = new URLSearchParams(window.location.search);//gets the parameters from the url
            var sticker_uuid = urlParams.get('uuid'); //getus uuid from url
            var parkapi = "https://" + urlParams.get('parkapi') + ".com/"; //gets the parjapi from urlParams
            //var push_endpoint = urlParams.get('pushdomain'); //getus uuid from url


            var responsejson = { "has_apologised": true, "sticker_uuid": sticker_uuid, "apologyRec": true, "apologyPN": -1 }; //creates the response json
            var refusePayload= "The terrible horrible parking man said hes refused to apologise for putting your life in danger";
            //Use $http service to send get request to API and execute different functions depending on whether it is successful or not

            //creates the payload to send to teh push apo that creates a push notification for the user who reported the incident
            var responsePayload = {   
                "recipient_id":"/topics/"+sticker_uuid,   
                "sender_id": "",   
                "message_id": "",   
                "message_type": 0,   
                "sender_role": 0,   
                "payload": "{\"RESPONSE\":\"The terrible horrible parking man has refused to apologise for putting your life in danger\"}"
            };
                /* "payload": JSON.stringify(responsejson),  */

            
            //sends the payload to the park api which allows the push notification to be sent
            vm.sendPayload(responsePayload).then(
                function success(response) {
                    $http.post(parkapi + 'responses/', JSON.stringify(responsejson))     //sends the responsejson to the park api
                        .then(
                            function success(response) {
                                vm.responses = response.data;//sets vm.response to match the server response
                                vm.hasResponded = true;     //hides the response buttons
                                vm.giveThanks = true;       //shows the thankyou message
                                console.info(response);     //displays the response in the console
                            },
                            function failure(err) {
                                console.error(err);         //shows the error message in the console
                            })
                },
                function failure(err) {
                    alert("fcm down! whoops!");             //shows an alert when the message fails to send
                    console.log(err);
                });
            //)


        }
        //sends the payload to the push api
        vm.sendPayload = function sendPayload(payload) {
            var urlParams = new URLSearchParams(window.location.search);//gets the parameters from the url
            var pushapi = urlParams.get('pushapi'); //gets push api from urlParams
            const SERVER_ROOT = "https://" +pushapi + ".herokuapp.com:443"; // heroku service hides secret

            console.log(" → asked to send this payload:", payload);

            var sendRequest = {
                method: 'POST',
                url: SERVER_ROOT + '/messages',
                data: JSON.stringify(payload)
            };

            console.log('push.service.sendPayload - using ', sendRequest);

            return $http(sendRequest); // send back a promise
        };





        vm.init();
    }

    sketch = Sketch.create()
sketch.mouse.x = sketch.width / 10
sketch.mouse.y = sketch.height
skylines = []
dt = 1

#
# BUILDINGS
#
  
Building = ( config ) ->
  this.reset( config )

Building.prototype.reset = (config) ->
  this.layer = config.layer
  this.x = config.x
  this.y = config.y
  this.width = config.width
  this.height = config.height
  this.color = config.color  
  this.slantedTop = floor( random( 0, 10 ) ) == 0
  this.slantedTopHeight = this.width / random( 2, 4 )
  this.slantedTopDirection = round( random( 0, 1 ) ) == 0
  this.spireTop = floor( random( 0, 15 ) ) == 0
  this.spireTopWidth = random( this.width * .01, this.width * .07 )
  this.spireTopHeight = random( 10, 20 )
  this.antennaTop = !this.spireTop && floor( random( 0, 10 ) ) == 0
  this.antennaTopWidth = this.layer / 2
  this.antennaTopHeight = random(5, 20) 
    
Building.prototype.render = ->
  sketch.fillStyle = sketch.strokeStyle = this.color
  sketch.lineWidth = 2
  
  sketch.beginPath()
  sketch.rect( this.x, this.y, this.width, this.height )
  sketch.fill()
  sketch.stroke()
    
  if this.slantedTop
    sketch.beginPath()
    sketch.moveTo( this.x, this.y )
    sketch.lineTo( this.x + this.width, this.y )
    if this.slantedTopDirection
      sketch.lineTo( this.x + this.width, this.y - this.slantedTopHeight )
    else
      sketch.lineTo( this.x, this.y - this.slantedTopHeight )
    sketch.closePath()
    sketch.fill()
    sketch.stroke()
     
  if this.spireTop
    sketch.beginPath()
    sketch.moveTo( this.x + ( this.width / 2 ), this.y - this.spireTopHeight )
    sketch.lineTo( this.x + ( this.width / 2 ) + this.spireTopWidth, this.y )
    sketch.lineTo( this.x + ( this.width / 2 ) - this.spireTopWidth, this.y )
    sketch.closePath()
    sketch.fill()
    sketch.stroke()
   
  if this.antennaTop
    sketch.beginPath()
    sketch.moveTo( this.x + ( this.width / 2 ), this.y - this.antennaTopHeight )
    sketch.lineTo( this.x + ( this.width / 2 ), this.y )
    sketch.lineWidth = this.antennaTopWidth
    sketch.stroke()

#
# SKYLINES
#

Skyline = (config) -> 
  this.x = 0
  this.buildings = []
  this.layer = config.layer
  this.width =
    min: config.width.min
    max: config.width.max
  this.height =
    min: config.height.min
    max: config.height.max
  this.speed = config.speed
  this.color = config.color
  this.populate()
  return this
  
Skyline.prototype.populate = ->
  totalWidth = 0
  while totalWidth <= sketch.width + ( this.width.max * 2 )
    newWidth = round ( random( this.width.min, this.width.max ) )
    newHeight = round ( random( this.height.min, this.height.max ) )
    this.buildings.push( new Building(
      layer: this.layer
      x: if this.buildings.length == 0 then 0 else ( this.buildings[ this.buildings.length - 1 ].x + this.buildings[ this.buildings.length - 1 ].width )
      y: sketch.height - newHeight
      width: newWidth
      height: newHeight
      color: this.color
    ) )
    totalWidth += newWidth

Skyline.prototype.update = ->
  this.x -= ( sketch.mouse.x * this.speed ) * dt
      
  firstBuilding = this.buildings[ 0 ]
  if firstBuilding.width + firstBuilding.x + this.x < 0
    newWidth = round ( random( this.width.min, this.width.max ) )
    newHeight = round ( random( this.height.min, this.height.max ) )
    lastBuilding = this.buildings[ this.buildings.length - 1 ]    
    firstBuilding.reset(
      layer: this.layer
      x: lastBuilding.x + lastBuilding.width
      y: sketch.height - newHeight
      width: newWidth
      height: newHeight
      color: this.color
    )    
    this.buildings.push( this.buildings.shift() )

Skyline.prototype.render = ->
  i = this.buildings.length
  sketch.save()
  sketch.translate( this.x, ( sketch.height - sketch.mouse.y ) / 20 * this.layer )  
  this.buildings[ i ].render ( i ) while i--
  sketch.restore()

#
# SETUP
#
  
sketch.setup = ->    
  i = 5
  while i--
    skylines.push( new Skyline(
      layer: i + 1
      width:
        min: ( i + 1 ) * 30
        max: ( i + 1 ) * 40
      height:
        min: 150 - ( ( i ) * 35 )
        max: 300 - ( ( i ) * 35 )
      speed: ( i + 1 ) * .003
      color: 'hsl( 200, ' + ( ( ( i + 1 ) * 1 ) + 10 ) + '%, ' + ( 75 - ( i * 13 ) ) + '% )'
    ) )

#
# CLEAR
#
  
sketch.clear = ->
  sketch.clearRect( 0, 0, sketch.width, sketch.height )

#
# UPDATE
#
  
sketch.update = ->
  dt = if sketch.dt < .1 then .1 else sketch.dt / 16
  dt = if dt > 5 then 5 else dt
  i = skylines.length
  skylines[ i ].update( i ) while i--
  
#
# DRAW
#
  
sketch.draw = ->
  i = skylines.length
  skylines[ i ].render( i ) while i--

#
# Mousemove Fix
#  
    
$( window ).on 'mousemove', (e) ->
  sketch.mouse.x = e.pageX
  sketch.mouse.y = e.pageY

})();