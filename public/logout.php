<?php

session_start();
unset($_SESSION['fs-session']); //clear session variable
unset($_SESSION['fingerprint']); //clear fingerprint variable
session_destroy();
header('Location: ' . $_SERVER['SERVER_NAME'] . dirname($_SERVER['PHP_SELF'])); //redirect back to main page

?>
