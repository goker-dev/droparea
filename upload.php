<?php

// Maximum file size
$maxsize = 1024; //Kb
// Supporting image file types
$types = Array('image/png', 'images/gif', 'image/jpeg');

$headers = getallheaders();

// LOG
$log = '=== ' . @date('Y-m-d H:i:s') . ' ===============================' . "\n"
        . 'HEADERS:' . print_r($headers, 1) . "\n";
$fp = fopen('log.txt', 'a');
fwrite($fp, $log);
fclose($fp);

// Result object
$r = new stdClass();
// Result content type
header('content-type: application/json');

// File size control
if ($headers['x-file-size'] > ($maxsize * 1024)) {
    $r->error = "Max file size: $maxsize Kb";
}

$folder = $headers['x-param-folder'] ? $headers['x-param-folder'] . '/' : '';
if ($folder && !is_dir($folder))
    mkdir($folder);

// File type control
if (in_array($headers['x-file-type'], $types)) {
    // Create an unique file name    
    if ($headers['x-param-value']) {
        $filename = $folder . $headers['x-param-value'];
    } else {
        $filename = $folder . sha1(@date('U') . '-' . $headers['x-file-name'])
                . '.' . $headers['x-param-type'];
    }
    // Uploaded file source
    $source = file_get_contents('php://input');
    // Image resize
    imageresize($source, $filename,
            $headers['x-param-width'],
            $headers['x-param-height'],
            $headers['x-param-crop'],
            $headers['x-param-quality']);
} else
    $r->error = "Unsupported file type: " . $headers['x-file-type'];

// File path
$path = str_replace('upload.php', '', $_SERVER['SCRIPT_NAME']);
// Image tag
$r->filename = $filename;
$r->path = $path;
$r->img = '<img src="' . $path . $filename . '" alt="image" />';
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
        error_log('height: '.$new_height.' - width: '.$new_width);
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
                imagepng($crop ? $crop : $new, $destination);
                break;
        }
        @imagedestroy($image);
        @imagedestroy($new);
        @imagedestroy($crop);
    }
}

?>
