<?php

session_start();
unset($_SESSION['fs-session']); //clear session variable
unset($_SESSION['fingerprint']); //clear fingerprint variable
session_destroy();
header('Location: /'); //redirect back to main page

?>
