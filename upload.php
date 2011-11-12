<?php

// LOG
$log = '=== ' . @date('Y-m-d H:i:s') . ' ===============================' . "\n"
        . 'FILES:' . print_r($_FILES, 1) . "\n"
        . 'POST:' . print_r($_POST, 1) . "\n";
$fp = fopen('upload-log.txt', 'a');
fwrite($fp, $log);
fclose($fp);


// Result object
$r = new stdClass();
// Result content type
header('content-type: application/json');


// Maximum file size
$maxsize = 10; //Mb
// File size control
if ($_FILES['xfile']['size'] > ($maxsize * 1048576)) {
    $r->error = "Max file size: $maxsize Kb";
}


// Uploading folder
$folder = 'files/';
if (!is_dir($folder))
    mkdir($folder);
// If specifics folder 
$folder .= $_POST['folder'] ? $_POST['folder'] . '/' : '';
if (!is_dir($folder))
    mkdir($folder);


// If the file is an image
if (preg_match('/image/i', $_FILES['xfile']['type'])) {

    $filename = $_POST['value'] ? $_POST['value'] :
            $folder . sha1(@microtime() . '-' . $_FILES['xfile']['name']) . '.jpg';
} else {

    $tld = split(',', $_FILES['xfile']['name']);
    $tld = $tld[count($tld) - 1];
    $filename = $_POST['value'] ? $_POST['value'] :
            $folder . sha1(@microtime() . '-' . $_FILES['xfile']['name']) . $tld;
}


// Supporting image file types
$types = Array('image/png', 'image/gif', 'image/jpeg');
// File type control
if (in_array($_FILES['xfile']['type'], $types)) {
    // Create an unique file name    
    // Uploaded file source
    $source = file_get_contents($_FILES["xfile"]["tmp_name"]);
    // Image resize
    imageresize($source, $filename, $_POST['width'], $_POST['height'], $_POST['crop'], $_POST['quality']);
} else
// If the file is not an image
    move_uploaded_file($_FILES["xfile"]["tmp_name"], $filename);


// File path
$path = str_replace('upload.php', '', $_SERVER['SCRIPT_NAME']);

// Result data
$r->filename = $filename;
$r->path = $path;
$r->img = '<img src="' . $path . $filename . '" alt="image" />';

// Return to JSON
echo json_encode($r);

// Image resize function with php + gd2 lib
function imageresize($source, $destination, $width = 0, $height = 0, $crop = false, $quality = 80) {
    $quality = $quality ? $quality : 80;
    $image = imagecreatefromstring($source);
    if ($image) {
        // Get dimensions
        $w = imagesx($image);
        $h = imagesy($image);
        if (($width && $w > $width) || ($height && $h > $height)) {
            $ratio = $w / $h;
            if (($ratio >= 1 || $height == 0) && $width && !$crop) {
                $new_height = $width / $ratio;
                $new_width = $width;
            } elseif ($crop && $ratio <= ($width / $height)) {
                $new_height = $width / $ratio;
                $new_width = $width;
            } else {
                $new_width = $height * $ratio;
                $new_height = $height;
            }
        } else {
            $new_width = $w;
            $new_height = $h;
        }
        $x_mid = $new_width * .5;  //horizontal middle
        $y_mid = $new_height * .5; //vertical middle
        // Resample
        error_log('height: ' . $new_height . ' - width: ' . $new_width);
        $new = imagecreatetruecolor(round($new_width), round($new_height));
        imagecopyresampled($new, $image, 0, 0, 0, 0, $new_width, $new_height, $w, $h);
        // Crop
        if ($crop) {
            $crop = imagecreatetruecolor($width ? $width : $new_width, $height ? $height : $new_height);
            imagecopyresampled($crop, $new, 0, 0, ($x_mid - ($width * .5)), 0, $width, $height, $width, $height);
            //($y_mid - ($height * .5))
        }
        // Output
        // Enable interlancing [for progressive JPEG]
        imageinterlace($crop ? $crop : $new, true);

        $dext = strtolower(pathinfo($destination, PATHINFO_EXTENSION));
        if ($dext == '') {
            $dext = $ext;
            $destination .= '.' . $ext;
        }
        switch ($dext) {
            case 'jpeg':
            case 'jpg':
                imagejpeg($crop ? $crop : $new, $destination, $quality);
                break;
            case 'png':
                $pngQuality = ($quality - 100) / 11.111111;
                $pngQuality = round(abs($pngQuality));
                imagepng($crop ? $crop : $new, $destination, $pngQuality);
                break;
            case 'gif':
                imagegif($crop ? $crop : $new, $destination);
                break;
        }
        @imagedestroy($image);
        @imagedestroy($new);
        @imagedestroy($crop);
    }
}

?>