<?php

error_reporting(E_ALL);

require_once('includes/config.php');
require_once('includes/fs-auth-lib.php');

session_start();

$fs = new FSAuthentication($ENDPOINT_SUBDOMAIN);

// If we're returning from the oauth2 redirect, capture the code and store session
// this way we don't have to reauthenticate after every reload
if( isset($_REQUEST['code']) ) {
	  $_SESSION['fs-session'] = $fs->GetAccessToken($DEV_KEY, $_REQUEST['code']); //Store access code in session variable
	  header('Location: ' . '/'); //Refresh page to clear POST variables
	  exit;
  } 

// If don't already have access token, began request
  else if (!isset($_SESSION['fs-session'])) {
	$url = $fs->RequestAccessCode($DEV_KEY, $OAUTH2_REDIRECT_URI);
	header("Location: " . $url); //Redirect to FamilySearch auth page
}

$access_token = $_SESSION['fs-session']; //store access token in variable

?>

<!DOCTYPE html>
<html>
    <head>
        <title>RootsMapper</title>
        <!-- Google Maps API reference -->
        <script
            src="https://maps.googleapis.com/maps/api/js?sensor=false&libraries=places,geometry">
        </script>
        
	<!-- map references -->

	<!-- loading animation references -->
	<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.js"></script>
	<script type="text/javascript" src="scripts/jquery.activity-indicator-1.0.0.js"></script>
	<!-- loading animation references -->

        <link href="css/map.css" rel="stylesheet" />
        <script src="scripts/map.js"></script>
		<script src="scripts/oms.js"></script>
        <script type="text/javascript">
             accesstoken='<?php echo($access_token); ?>';
             baseurl='<?php echo("https://" . $ENDPOINT_SUBDOMAIN . ".familysearch.org/familytree/v2/"); ?>';
	</script>
	<script language="javascript" type="text/javascript">
  		$(window).load(function() {
    		$('#loading').hide();
 	 });
	</script>

    </head>
    <body>
        
        <div id="rootGrid">
            <div id="mapdisplay"></div>
	    <div id="inputFrame">
		<input id="personid" type="text" size="30" placeholder="ID..." onkeypress="if (event.keyCode ==13) ancestorgens()"/></br>
                <input id="start" type="text" size="30" placeholder="Generations..." onkeypress="if (event.keyCode ==13) ancestorgens()"/>
	    <button id="populateUser" onclick="populateUser()">ME</button>
		</div>
            <div id="loading" class="square"></div>
           <button id="logoutbutton" onclick="window.location='logout.php'" onmouseover="this.style.backgroundColor='red';return true;" onmouseout="this.style.backgroundColor='darkred';return true;">Logout</button>
        </div>
    </body>
</html>
