<?php

// LOG
$log = '=== ' . @date('Y-m-d H:i:s') . ' ===============================' . "\n"
        . 'FILES:' . print_r($_FILES, 1) . "\n"
        . 'POST:' . print_r($_POST, 1) . "\n";
$fp = fopen('post-log.txt', 'a');
fwrite($fp, $log);
fclose($fp);


// Result object
$r = new stdClass();
// Result content type
header('content-type: application/json');


$data = $_POST['thumbnail'];
unset($_POST['thumbnail']);

if($data){

    // Uploading folder
    $folder = 'files/';
    if (!is_dir($folder))
        mkdir($folder);
    // If specifics folder 
    $folder .= $_POST['folder'] ? $_POST['folder'] . '/' : '';
    if (!is_dir($folder))
        mkdir($folder);


    $filename = $_POST['value'] ? $_POST['value'] :
            $folder . sha1(@microtime() . '-' . $_POST['name']) . '.jpg';


    $data = split(',', $data);
    file_put_contents($filename, base64_decode($data[1]));
    
}
die(json_encode(array_merge(array('url' => $filename), $_POST)));

?>