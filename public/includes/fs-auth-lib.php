<?php

class FSAuthentication {
    public $CurlHeaders;
    public $ResponseCode;

    private $_AuthorizeUrl;
    private $_AccessTokenUrl;

    public function __construct($subdomain) {
        $this->CurlHeaders = array();
        $this->ResponseCode = 0;
        $this->_AuthorizeUrl = "https://" . $subdomain . ".familysearch.org/cis-web/oauth2/v3/authorization";
        $this->_AccessTokenUrl = "https://" . $subdomain . ".familysearch.org/cis-web/oauth2/v3/token";
    }
 
    public function RequestAccessCode ($client_id, $redirect_url) {
        return($this->_AuthorizeUrl . "?client_id=" . $client_id . "&response_type=code&redirect_uri=" . $redirect_url);
    }
 
    // Convert an authorization code from a callback into an access token.
    public function GetAccessToken($client_id, $auth_code) {        
        // Init cUrl.
	
	$r = $this->InitCurl($this->_AccessTokenUrl);

        // Assemble POST parameters for the request.
        $post_fields = "code=" . urlencode($auth_code) . "&client_id=" . $client_id . "&grant_type=authorization_code";
 
        // Obtain and return the access token from the response.
        curl_setopt($r, CURLOPT_POST, true);
        curl_setopt($r, CURLOPT_POSTFIELDS, $post_fields);
 
        $response = curl_exec($r);
        if ($response == false) {
            die("curl_exec() failed. Error: " . curl_error($r));
        }
 
        //Parse JSON return object.
        return json_decode($response)->{'access_token'};
    }
 
    private function InitCurl($url) {
        $r = null;
 
        if (($r = @curl_init($url)) == false) {
            header("HTTP/1.1 500", true, 500);
            die("Cannot initialize cUrl session. Is cUrl enabled for your PHP installation?");
        }
 
        curl_setopt($r, CURLOPT_RETURNTRANSFER, 1);
 
        // Decode compressed responses.
        curl_setopt($r, CURLOPT_ENCODING, 1);
 
        // NOTE: If testing locally, add the following lines to use a dummy certificate, and to prevent cUrl from attempting to verify
        // the certificate's authenticity. See http://richardwarrender.com/2007/05/the-secret-to-curl-in-php-on-windows/ for more
        // details on this workaround. If your server has a valid SSL certificate installed, comment out these lines.
        curl_setopt($r, CURLOPT_SSL_VERIFYPEER, false);
        //curl_setopt($r, CURLOPT_CAINFO, "C:\wamp\bin\apache\Apache2.2.21\cacert.crt");
 
        // NOTE: For Fiddler2 debugging.
        //curl_setopt($r, CURLOPT_PROXY, '127.0.0.1:8888');
 
        return($r);
    }
 
}
 
?>

