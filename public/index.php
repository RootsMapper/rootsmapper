<!DOCTYPE html>
<html>
    <head>
        <title></title>
        <!-- Google Maps API reference -->
        <script
            src="https://maps.googleapis.com/maps/api/js?sensor=false&libraries=places,geometry">
        </script>
        
        <!-- map references -->
        <link href="./map.css" rel="stylesheet" />
        
        <script src="./map.js"></script>

    </head>
    <body>
        <div id="rootGrid">
            
            <div id="mapdisplay"></div>
            <div id="inputFrame">
                <input id="start" type="text" size="30" placeholder="Generations..." onkeypress="if (event.keyCode ==13) ancestorgens()"/>
                
            </div>
           
        </div>
    </body>
</html>
