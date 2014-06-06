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
          $url_params = (isset($_SESSION['root'])? ("root=" . $_SESSION['root']) : "") . (isset($_SESSION['gens'])? ("&gens=" . $_SESSION['gens']) : "") . (isset($_SESSION['selected'])? ("&selected=" . $_SESSION['selected']) : "" . (isset($_SESSION['expand'])? ("&expand=" . $_SESSION['expand']) : ""));
	  header("Location: ./" . (isset($url_params)? "?" . $url_params : "")); //Refresh page to clear POST variables
	  exit;
}

// If login is clicked, begin request
else if (isset($_REQUEST['login'])) {
	unset($_SESSION['fs-session']); //clear session variable
	unset($_SESSION['fingerprint']); //clear fingerprint variable
	//session_destroy();
	$url = $fs->RequestAccessCode($DEV_KEY, $OAUTH2_REDIRECT_URI);
	header("Location: " . $url); //Redirect to FamilySearch auth page
	exit;
}

// Store URL parameters
$_SESSION['root'] = isset($_GET['root'])? trim(preg_replace('/[^A-z0-9\-]+/','',$_GET['root'])) : "";
$_SESSION['gens'] = isset($_GET['gens'])? trim(preg_replace('/[^0-9]+/','',$_GET['gens'])) : "";
$_SESSION['selected'] = isset($_GET['selected'])? trim(preg_replace('/[^0-9\,]+/','',$_GET['selected'])) : "";
$_SESSION['expand'] = isset($_GET['expand'])? trim(preg_replace('/[^0-9\,\;]+/','',$_GET['expand'])) : "";

// If we have both a valid auth token in our session and our fingerprint matches
// set the access token to a local variable, otherwise make sure it is unset
if (isset($_SESSION['fs-session']) && $_SESSION['fingerprint'] == md5($fingerprint))
{
	$access_token = $_SESSION['fs-session']; //store access token in variable
	$GET_ROOT = isset($_SESSION['root'])? $_SESSION['root'] : "";
	$GET_GENS = isset($_SESSION['gens'])? $_SESSION['gens'] : "";
	$GET_SELECTED = isset($_SESSION['selected'])? $_SESSION['selected'] : "";
	$GET_EXPAND = isset($_SESSION['expand'])? $_SESSION['expand'] : "";
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
		<link href='https://fonts.googleapis.com/css?family=Open+Sans:400,700' rel='stylesheet' type='text/css' />
	<!-- map references -->

	<!-- loading animation references -->
	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>
	<script type="text/javascript" src="scripts/loading.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
	<!-- loading animation references -->
		<script src="scripts/binarytree.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/fsAPI.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/tooltip.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/utilities.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
        <script src="scripts/map.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/oms.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/infobox.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
		<script src="scripts/url-template.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script>
        <script type="text/javascript">
             title='<?php echo isset($TITLE)? $TITLE : ""; ?>';
             cur_title=title;
             accesstoken='<?php echo isset($access_token) ? $access_token : ""; ?>';
             baseurl='<?php echo("https://" . ($SITE_MODE == 'sandbox' ? "sandbox." : "") . "familysearch.org"); ?>';
             version='<?php echo isset($VERSION)? $VERSION : ""; ?>';
             get_root='<?php echo isset($GET_ROOT)? $GET_ROOT : ""; ?>';
             get_gens='<?php echo isset($GET_GENS)? $GET_GENS : ""; ?>';
             get_selected='<?php echo isset($GET_SELECTED)? $GET_SELECTED : ""; ?>';
             get_expand='<?php echo isset($GET_EXPAND)? $GET_EXPAND : ""; ?>';
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
					<div id="zoomControl" class='unselectable'>
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

	<div id='toggleHeaderBox' class='unselectable' onclick='toggleHeaderBox();'>
		<img id='triangleNarrow' src="images/triangle-up.png">
		<!-- <img class='triangleNarrow' src="images/triangle-up.png"> -->
	</div>

    <div id="headerbox">
		<ul style="list-style-type: none; margin: 0; padding: 0; -webkit-transition: height 0.3s, width 0.3s; transition: height 0.3s, width 0.3s;">
			<li id='rootsMapper' class='menuButton selected unselectable' >
				<div id='rootsMapperSpan' class='menuButtonSpan lighted'>RootsMapper</div>
				<div id="rootDiv">
					<div id="personName" style="margin-left: 20px; padding-right: 15px;">Root Name</div>
		 			<input id="personid" type="text" maxlength="8" placeholder="ID..." onkeypress="if (event.keyCode ==13) checkID()"/>
					<script src="scripts/keyfilter.js?v=<?php echo isset($VERSION)? $VERSION : ""; ?>"></script></br>
					<ul id="runList" class="listClass">
						<li class="main" onclick="checkID(); expandList({listName:'runList'});"><img class="triangle" src="images/triangle-down.png"><b>Start</b></li>
						<li class="item" onclick="expandList({listName:'runList'}); rootsMapper({generations:1})">1 generation</li>
						<li class="item" onclick="expandList({listName:'runList'}); rootsMapper({generations:2})">2 generations</li>
						<li class="item" onclick="expandList({listName:'runList'}); rootsMapper({generations:3})">3 generations</li>
						<li class="item" onclick="expandList({listName:'runList'}); rootsMapper({generations:4})">4 generations</li>
						<li class="item" onclick="expandList({listName:'runList'}); rootsMapper({generations:5})">5 generations</li>
						<li class="item" onclick="expandList({listName:'runList'}); rootsMapper({generations:6})">6 generations</li>
						<li class="item" onclick="expandList({listName:'runList'}); rootsMapper({generations:7})">7 generations</li>
						<li class="item" onclick="expandList({listName:'runList'}); rootsMapper({generations:8})">8 generations</li>
						<li class="item" onclick="expandList({listName:'runList'}); rootsMapper({generations:9})">9 generations</li>
						<li class="item" onclick="expandList({listName:'runList'}); rootsMapper({generations:10})">10 generations</li>
					</ul>
				</div>
			</li>
			<li id='viewOptions' class='menuButton unselectable' >
				<div id='viewOptionsSpan' class='menuButtonSpan'>Map Options</div>
				<div id="optionButtons">
					<button id="showlines" class="button yellow off" onclick="toggleLines()">Lines</button>
					<button id="showpins" class="button yellow off" onclick="togglePins()">Pins</button>
					<button id="countryToggle" class="button yellow off" onclick="toggleLayers()">Countries</button>
					<button id="highlight" class="button yellow off" onclick="toggleHighlight()">Traceback</button>
					<button id="isolate" class="button yellow" onclick="toggleIsolate()">Isolate</button>
					<button id="KML" class="button yellow off" onclick="createKML()">Export KML</button>
					<ul id="isolateList" class="listClass">
						<li class="main" onclick="expandList({listName:'isolateList'});"><img class="triangle" src="images/triangle-down.png"><b>Single Gen</b></li>
						<li class="item" onclick="expandList({listName:'isolateList'}); isolateLoop()">View All</li>
						<li class="item" onclick="expandList({listName:'isolateList'}); isolateLoop('',false,1)">1<sup>st</sup> generation</li>
					</ul>
				</div>
			</li>
			<li id='pedigreeChart' class='menuButton unselectable' >
				<div id='pedigreeChartSpan' class='menuButtonSpan'>Pedigree Chart</div>
				<div id="pedigreeDiv">
					<div id="pedigree">
						<div class="trees unselectable"><div id="tree1" ></div>
						<div class="trees unselectable"><div id="tree2" ></div>
						<div class="trees unselectable"><div id="tree3" ></div>
					</div>
				</div>
			</li>
			<li id='countryStatistics' class='menuButton unselectable' >
				<div id='countryStatisticsSpan' class='menuButtonSpan'>Country Statistics</div>
				<div id="countryDiv">
					<div id="countryStats"></div>
					<div id="countryListHolder">
						<ul id="countryList" class="listClass">
							<li class="main" onclick="expandList({listName:'countryList'});"><img class="triangle" src="images/triangle-down.png"><b>Generation</b></li>
							<li class="item" onclick="expandList({listName:'countryList'}); countryLoop()">All generations</li>
							<li class="item" onclick="expandList({listName:'countryList'}); countryLoop('',false,1)">1<sup>st</sup> generation</li>
						</ul>
					</div>
				</div>
			</li>
			<li id='userInfo' class='menuButton unselectable' >
				<div id="username" class='menuButtonSpan' >Current User</div>
				<div id="userDiv">
					<button id="copyUserId" class="button blue" onclick="populateUser()">Set As Root</button>
					<button id="logoutbutton" onclick="window.location='logout.php'">Logout</button>
				</div>
			</li>
		</ul>
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
