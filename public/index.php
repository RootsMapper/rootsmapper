<?php

require_once('includes/config.php');
require_once('includes/fs-auth-lib.php');

session_start();

$fs = new FSAuthentication($ENDPOINT_SUBDOMAIN);

//Generate fingerprint for session security
$fingerprint = $SECRET_WORD . $_SERVER['HTTP_USER_AGENT'];
$ipblocks = explode('.', $_SERVER['REMOTE_ADDR']);
for ($i=0; $i<2; $i++)
{
	$fingerprint .= $ipblocks[$i] . '.';
}


// If we're returning from the oauth2 redirect, capture the code and store session
// this way we don't have to reauthenticate after every reload
if( isset($_REQUEST['code']) ) {
	  session_regenerate_id(true); //Regenerate session ID
	  $_SESSION['fs-session'] = $fs->GetAccessToken($DEV_KEY, $_REQUEST['code']); //Store access code in session variable
	  $_SESSION['fingerprint'] = md5($fingerprint);
	  header('Location: ' . basename(__FILE__)); //Refresh page to clear POST variables
	  exit;
} 

// If don't already have access token, begin request
else if (!isset($_SESSION['fs-session']) || $_SESSION['fingerprint'] != md5($fingerprint)) {
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
		<script src="scripts/markerclusterer.js"></script>
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
			<div class="hoverdiv">
				<input id="personid" class="boxes" type="text" maxlength="8" placeholder="ID..." onkeypress="if (event.keyCode ==13) ancestorgens()"/>
				<button id="populateUser" class="buttons" onclick="populateUser()">ME</button>
			</div>
			<div class="hoverdiv">
				<select id="genSelect" class="boxes">
					<option value="1">1</option>
					<option value="2">2</option>
					<option value="3">3</option>
					<option value="4">4</option>
					<option value="5">5</option>
					<option value="6">6</option>
					<option value="7">7</option>
				</select>
				<button id="runButton" class="buttons" onclick="ancestorgens()">RUN</button>
			</div>
			<div class="hoverdiv">
				<input id="username" class="boxes" type="text" readonly>
				<button id="logoutbutton" class="buttons" onclick="window.location='logout.php'" onmouseover="this.style.backgroundColor='red';return true;" onmouseout="this.style.backgroundColor='darkred';return true;">LOGOUT</button>
			</div>
		</div>
		
            <div id="loading" class="square"></div>
           
        </div>
    </body>
</html>