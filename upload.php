<?php

// Maximum file size
$maxsize = 1024; //Kb
// Supporting image file types
$types = Array('image/png','images/gif','image/jpeg');

$headers = getallheaders();

// LOG
$log = '=== '. @date('Y-m-d H:i:s') . ' ========================================'."\n"
		.'HEADER:'.print_r($headers,1)."\n"
		.'GET:'.print_r($_GET,1)."\n"
		.'POST:'.print_r($_POST,1)."\n"
		.'REQUEST:'.print_r($_REQUEST,1)."\n"
		.'FILES:'.print_r($_FILES,1)."\n";
$fp = fopen('log.txt','a');
fwrite($fp, $log);
fclose($fp);

header('content-type: plain/text');

// File size control
if($headers['X-File-Size'] > ($maxsize *1024)) {
    die("Max file size: $maxsize Kb");
}

// File type control
if(in_array($headers['X-File-Type'],$types)){
    // Create an unique file name    
	if($headers['X-File-Encrypt'] == 'true' || $headers['X-File-Encrypt'] == 'TRUE' ) {
		$filename = $headers['X-File-Location'].sha1(@date('U').'-'.$headers['X-File-Name']).'.'.$_GET['type'];
	}else {
		$filename = $headers['X-File-Location'].$headers['X-File-Name'];
	}
    // Uploaded file source
    $source = file_get_contents('php://input');
	//Check if file exists in destination folder (Fix for encrypt = false)
	if(file_exists($path.$filename)) {
		$filename = $headers['X-File-Location'].$headers['X-File-Name'].'_'.@date('his').'.'.$_GET['type'];
	}
    // Image resize
    imageresize($source, $filename, $_GET['width'], $_GET['height'], $_GET['crop'], $_GET['quality']);
} else die("Unsupported file type: ".$headers['X-File-Type']);

// File path
$path = str_replace('upload.php','',$_SERVER['SCRIPT_NAME']);
// Image tag
echo '<img src="'.$path.$filename.'" alt="image" />';

// Image resize function with php + gd2 lib
function imageresize($source, $destination, $width = 0, $height = 0, $crop = false, $quality = 80) {
    $image = imagecreatefromstring($source);
    if ($image) {
        // Get dimensions
        $w = imagesx($image);
        $h = imagesy($image);
        if (($width && $w > $width) || ($height && $height > $h)) {
            $ratio = $w / $h;
            if (($ratio >= 1 || $height == 0) && !$crop) {
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
