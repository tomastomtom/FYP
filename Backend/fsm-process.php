<?php
$fsm = $_POST['fsm'];
$JSONFile = fopen("/home/ubuntu/fyp/fsm.json","w") or die ("Unable to write the JSON!");
fwrite($JSONFile, $fsm);
fclose($JSONFile);

//execute the JSON parser
exec('cd /home/ubuntu/fyp/; ./coding');
//zip the whole folder

$rootPath = realpath('/home/ubuntu/fyp/codeing');

$zip = new ZipArchive();
$zip->open('/home/ubuntu/fyp/codeing.zip', ZipArchive::CREATE | ZipArchive::OVERWRITE);


$files = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($rootPath),
    RecursiveIteratorIterator::LEAVES_ONLY
);

foreach ($files as $name => $file)
{
    if (!$file->isDir())
    {
        $filePath = $file->getRealPath();
        $relativePath = substr($filePath, strlen($rootPath) + 1);

        $zip->addFile($filePath, $relativePath);
    }
}

$zip->close();
header("Content-Type: application/zip");
header("Content-Disposition: attachment; filename=codeing.zip");
header("Content-Length: ". filesize('/home/ubuntu/fyp/codeing.zip'));

readfile('/home/ubuntu/fyp/codeing.zip');
exit;
 ?>
