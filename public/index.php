<?php

error_reporting(E_ALL);

require_once('includes/fs-auth-lib.php');
require_once('includes/config.php');

session_start();



$fs = new FSAuthentication();

// If we're returning from the oauth2 redirect, capture the code and store session
// this way we don't have to reauthenticate after every reload
if( isset($_REQUEST['code']) ) {
	  $_SESSION['fs-session'] = $fs->GetAccessToken($DEV_KEY, $_REQUEST['code']); //Store access code in session variable
	  header('Location: ' . basename(__FILE__)); //Refresh page to clear POST variables
	  exit;
  } 

// If don't already have access token, began request
  else if (!isset($_SESSION['fs-session'])) {
	$url = $fs->RequestAccessCode($DEV_KEY, $OAUTH2_REDIRECT_URI);
	header("Location: " . $url); //Redirect to FamilySearch auth page
}

$access_token = $_SESSION['fs-session']; //store access token in variable

//Output code
//echo "Access token is " . $access_token . "<p/>";


?>

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
        <script type="text/javascript">
             accesstoken='<?php echo($access_token); ?>';
        </script>
    </head>
    <body>
        
        <div id="rootGrid">
            <div id="mapdisplay"></div>
            <div id="inputFrame">
                <input id="start" type="text" size="30" placeholder="Generations..." onkeypress="if (event.keyCode ==13) ancestorgens()"/></br>
                <input id="personid" type="text" size="30" placeholder="ID..." onkeypress="if (event.keyCode ==13) ancestorgens()"/>
            </div>
           <button id="logoutbutton" onclick="window.location='logout.php'" onmouseover="this.style.backgroundColor='red';return true;" onmouseout="this.style.backgroundColor='darkred';return true;">Logout</button>
        </div>
    </body>
</html>
