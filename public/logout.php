<?php

session_start();
unset($_SESSION['fs-session']); //clear session variable
header('Location: ' . basename("index.php")); //redirect back to index.php

?>
