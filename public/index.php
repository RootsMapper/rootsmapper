<?php

require_once('includes/config.php');
require_once('includes/fs-auth-lib.php');

session_start();

switch ($SITE_MODE):
	case 'production':
		$auth_subdomain = "ident.";
		break;
	case 'beta':
		$auth_subdomain = "identbeta.";
		break;
	case 'sandbox':
		$auth_subdomain = "sandbox.";
		break;
endswitch;

$fs = new FSAuthentication($auth_subdomain);

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
	  header('Location: ./'); //Refresh page to clear POST variables
	  exit;
} 

// If login is clicked, begin request
else if (isset($_REQUEST['login'])) {
	unset($_SESSION['fs-session']); //clear session variable
	unset($_SESSION['fingerprint']); //clear fingerprint variable
	session_destroy();
	$url = $fs->RequestAccessCode($DEV_KEY, $OAUTH2_REDIRECT_URI);
	header("Location: " . $url); //Redirect to FamilySearch auth page
	exit;
}

// If we have both a valid auth token in our session and our fingerprint matches
// set the access token to a local variable, otherwise make sure it is unset
if (isset($_SESSION['fs-session']) && $_SESSION['fingerprint'] == md5($fingerprint))
{
	$access_token = $_SESSION['fs-session']; //store access token in variable
}
else
{
	unset($access_token);
}

?>

<!DOCTYPE html>
<html>
    <head>
        <title><?php echo isset($TITLE)? $TITLE : ""; ?></title>
        <?php echo isset($DESCRIPTION)? "<meta name=\"description\" content=\"" . $DESCRIPTION . "\" />" : ""; ?>

        <link href="css/map.css?v=<?php echo isset($VERSION)? $VERSION : ""; ?>" rel="stylesheet" />

        <!-- Google Maps API reference -->
        <script src="//maps.googleapis.com/maps/api/js?sensor=false&libraries=places,geometry"></script>
        <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Open+Sans:Condensed" />
	<!-- map references -->

	<!-- loading animation references -->
	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>
	<script type="text/javascript" src="scripts/loading.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
	<!-- loading animation references -->
		<script src="scripts/binarytree.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/CollapsibleLists.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/fsAPI.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/tooltip.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/utilities.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
        <script src="scripts/map.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/oms.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/infobox.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/url-template.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
        <script type="text/javascript">
             title='<?php echo isset($TITLE)? $TITLE : ""; ?>';
             accesstoken='<?php echo isset($access_token) ? $access_token : ""; ?>';
             baseurl='<?php echo("https://" . ($SITE_MODE == 'sandbox' ? "sandbox." : "") . "familysearch.org"); ?>';
             version='<?php echo isset($VERSION)? $VERSION : ""; ?>';
	</script>
	<script language="javascript" type="text/javascript">
  		$(window).load(function() {
    		$('#loading').hide();
 	 });
	</script>

    </head>
    <body>
        <?php echo isset($TRACKING_CODE) ? $TRACKING_CODE : ""; ?>
		<div id="bigDiv">
			<div id="adDiv">
<?php 
if (!empty($SIDEAD_CODE))
{ 
echo($SIDEAD_CODE);
}
?>
			</div>
			<div id="rootGrid">

<?php
if (!isset($access_token))
{ ?>
				<button id="loginbutton" onclick="window.location='?login'">Login to begin mapping</button>
<?php
}
?>

				<div id="mapDisplay"></div>
					<div id="zoomControl">
						<div id="zoomIn" class="zoom">+</div>
						<div id="zoomOut" class="zoom">&ndash;</div>
					</div>
<?php
// If we are authorized, load the buttons, otherwise show the login button
if (isset($access_token))
{ ?>
			

            <div id="loadingDiv" style="visibility: hidden">
            	<div id="loadHolder">
                    <div id="loading"></div>
                    <div id="loadingMessage"></div>
            	</div>
            </div>

			<div id="rootDiv">
				<ul id="runList" class="runListClass">
					<li id="runButton" onclick="expandList({listName:'runList'});"><b>Start</b><img class="triangle" src="images/triangle-down.png"></li>
					<li class="item" onclick="expandList({listName:'runList'}); ancestorgens(1)">1 generation</li>
					<li class="item" onclick="expandList({listName:'runList'}); ancestorgens(2)">2 generations</li>
					<li class="item" onclick="expandList({listName:'runList'}); ancestorgens(3)">3 generations</li>
					<li class="item" onclick="expandList({listName:'runList'}); ancestorgens(4)">4 generations</li>
					<li class="item" onclick="expandList({listName:'runList'}); ancestorgens(5)">5 generations</li>
					<li class="item" onclick="expandList({listName:'runList'}); ancestorgens(6)">6 generations</li>
					<li class="item" onclick="expandList({listName:'runList'}); ancestorgens(7)">7 generations</li>
					<li class="item" onclick="expandList({listName:'runList'}); ancestorgens(8)">8 generations</li>
					<li class="item" onclick="expandList({listName:'runList'}); ancestorgens(9)">9 generations</li>
					<li class="item" onclick="expandList({listName:'runList'}); ancestorgens(10)">10 generations</li>
				</ul>
				<div id="personName">Root Name</div>
     			<input id="personid" type="text" maxlength="8" placeholder="ID..." onkeypress="if (event.keyCode ==13) checkID()"/>
				<script src="scripts/keyfilter.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
			</div>

			<div id="countryBox">
				<ul id="countryList" class="countryListClass">
					<li class="item" onclick="expandList({listName:'countryList',arrowUp:true,buttonIndex:11}); countryLoop('',false,10)">10<sup>th</sup> generation</li>
					<li class="item" onclick="expandList({listName:'countryList',arrowUp:true,buttonIndex:11}); countryLoop('',false,9)">9<sup>th</sup> generation</li>
					<li class="item" onclick="expandList({listName:'countryList',arrowUp:true,buttonIndex:11}); countryLoop('',false,8)">8<sup>th</sup> generation</li>
					<li class="item" onclick="expandList({listName:'countryList',arrowUp:true,buttonIndex:11}); countryLoop('',false,7)">7<sup>th</sup> generation</li>
					<li class="item" onclick="expandList({listName:'countryList',arrowUp:true,buttonIndex:11}); countryLoop('',false,6)">6<sup>th</sup> generation</li>
					<li class="item" onclick="expandList({listName:'countryList',arrowUp:true,buttonIndex:11}); countryLoop('',false,5)">5<sup>th</sup> generation</li>
					<li class="item" onclick="expandList({listName:'countryList',arrowUp:true,buttonIndex:11}); countryLoop('',false,4)">4<sup>th</sup> generation</li>
					<li class="item" onclick="expandList({listName:'countryList',arrowUp:true,buttonIndex:11}); countryLoop('',false,3)">3<sup>rd</sup> generation</li>
					<li class="item" onclick="expandList({listName:'countryList',arrowUp:true,buttonIndex:11}); countryLoop('',false,2)">2<sup>nd</sup> generation</li>
					<li class="item" onclick="expandList({listName:'countryList',arrowUp:true,buttonIndex:11}); countryLoop('',false,1)">1<sup>st</sup> generation</li>
					<li class="item" onclick="expandList({listName:'countryList',arrowUp:true,buttonIndex:11}); countryLoop()">All generations</li>
					<li id="countryButton" onclick="expandList({listName:'countryList',arrowUp:true,buttonIndex:11});"><b>Country Totals</b><img class="triangle" src="images/triangle-up.png"></li>
				</ul>
				<div id="countryStats"></div>
			</div>

			<div style="position: absolute; top: 0px; left: 0px; height: 0px; width: 100%; text-align: center">
				<div id="newTree">
					<div id="tree1" class="trees"></div>
					<div id="tree3" class="trees"></div></br>
					<div id="tree2" class="trees"></div>
				</div>
			</div>

			<div id="optionButtons">
				<button id="showlines" class="button yellow off" onclick="toggleLines()">Lines</button>
				<button id="highlight" class="button yellow off" onclick="toggleHighlight()">Traceback</button>
				<button id="isolate" class="button yellow" onclick="toggleIsolate()">Isolate</button>
				<button id="reset" class="button yellow off" onclick="clearOverlays()">Reset</button>
			</div>


			<div id="lowerbuttonbox">
				<button id="logoutbutton" onclick="window.location='logout.php'">Logout</button>
		    	<div id="userDiv">
		    	<button id="populateUser" class="button blue" onclick="populateUser()">Set as root</button>
					<div id="username" onclick="populateUser()"></div>
				</div>
			</div>

<?php
}
?>
				
			    <div id="lowerbuttonframe">
						


<?php
if (!empty($PLEDGIE_CODE))
{
?>
            		<a href='https://pledgie.com/campaigns/<?php echo($PLEDGIE_CODE); ?>' target='_blank'><img id="pledgiebutton" src='https://pledgie.com/campaigns/ <?php echo($PLEDGIE_CODE); ?> .png?skin_name=chrome' border='0' ></a>
<?php
}
if (!empty($FAQ_URL))
{
?>
            		<button id="faqbutton" class="button red" onclick="window.open('<?php echo($FAQ_URL); ?>', '_blank')">?</button>
<?php
}
if (!empty($FEEDBACK_URL))
{
?>
            		<button id="feedbackbutton" class="button blue" onclick="window.open('<?php echo($FEEDBACK_URL); ?>', '_blank')">!</button>
<?php
}
if (!empty($DONATE_URL))
{
?>
            		<button id="donatebutton" class="button green" onclick="window.open('<?php echo($DONATE_URL); ?>', '_blank')">$</button>
<?php
} 
if (!empty($BLOG_URL))
{
?>
            		<button id="blogbutton" class="button green" onclick="window.open('<?php echo($BLOG_URL); ?>', '_blank')">Blog</button>
<?php
}
?>
					
						
				</div>
			</div>
		</div>
</body>
</html>
