<?php

session_start();
unset($_SESSION['fs-session']); //clear session variable
session_destroy();
header('Location: ' . '/'); //redirect back to index.php

?>
