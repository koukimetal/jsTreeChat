<?php

include_once 'config.php';

$action = $_POST ['action'];

if ($action === 'write') {
	$parentId = $_POST ['parentId'];
	$textContent = $_POST ['textContent'];
	$username = $_POST ['username'];
	$password = $_POST ['password'];
	
	write($parentId, $username, $password, "comment", $textContent);
	header ( "Content-Type: application/json; charset=utf-8" );
	echo '{ "data" : "done"}';
	return;
}

$parent = $_GET ['p'];
if (is_numeric ( $parent ) && ctype_digit ( $parent )) {
	$resp = read($parent);
	header ( "Content-Type: application/json; charset=utf-8" );
	echo json_encode($resp);
	return;
} else {
	header ( "Content-Type: application/json; charset=utf-8" );
	echo '[{ "text" : "root", "id" : "0", "children" : true }]';
	return;
}

function getDBH() {
	$dbh = new PDO ( 'sqlite:' .DATABASE_NAME, DATABASE_USER, DATABASE_PASS );
	
	$sql = "CREATE TABLE IF NOT EXISTS `" .TABLE_NAME ."`"
			. "("
			. "`id` INTEGER PRIMARY KEY"
			. ",`parent` INT" . ",`name` TEXT" . ",`pass` TEXT"
			. ",`type` TEXT" . ",`content` TEXT, `children` BOOLEAN, `date` DATETIME"
			. ");";
			
	$dbh->query($sql);
	return $dbh;
}

//TODO implement type
//TODO check security
//TODO implement search
//TODO implement delete

function read($parentId) {
	$dbh = getDBH();
	$stmt = $dbh->prepare("SELECT `id`, `name`, `content`, `date`, `children` FROM `" .TABLE_NAME ."` "
			."WHERE `parent` == :parent");
	$stmt->bindParam(':parent', $parentId, PDO::PARAM_INT);
	$stmt->execute();
	$result = $stmt->fetchAll();
	
	$resp = array();
	for($i = 0; $i < count($result); $i++) {
		$resp[$i]['id'] = $result[$i]['id'];
		$modifiedDate = date('Y-m-d H:i:s', strtotime($result[$i]['date'] .' +' .TIME_ZONE.' hour'));
		$resp[$i]['text'] = htmlspecialchars($result[$i]['name'])
		.": " .htmlspecialchars($result[$i]['content']) ." (" .$modifiedDate .")";
		$resp[$i]['children'] = filter_var($result[$i]['children'], FILTER_VALIDATE_BOOLEAN);
	}
	
	return $resp;
}


function write($parentId, $name, $pass, $type, $content) {	
	try {
		$dbh = getDBH();
		$stmt = $dbh->prepare("INSERT INTO `" .TABLE_NAME ."` (parent, name, pass, type, content, children, date)"
				."VALUES (:parent, :name, :pass, :type, :content, :children, datetime('now'))");
		$stmt->bindParam(':parent', $parentId, PDO::PARAM_INT);
		$stmt->bindParam(':name', $name, PDO::PARAM_STR);
		$stmt->bindParam(':pass', makeHash($pass), PDO::PARAM_STR);
		$stmt->bindParam(':type', $type, PDO::PARAM_STR);
		$stmt->bindParam(':content', $content, PDO::PARAM_STR);
		$stmt->bindValue(':children', false, PDO::PARAM_BOOL);
		$stmt->execute();
		
		//update parent's children
		if($parentId > 0) {
			$stmt = $dbh->prepare("UPDATE `" .TABLE_NAME ."` SET `children` = :children WHERE `id` == :id");
			$stmt->bindValue(':children', true, PDO::PARAM_BOOL);
			$stmt->bindParam(':id', $parentId, PDO::PARAM_INT);
			$stmt->execute();
		}
	} catch ( PDOException $e ) {
		print "error:" . $e->getMessage () . "<br/>";
		die ();
	} catch (Exception $e) {
		print "error:" . $e->getMessage () . "<br/>";
		die ();
	}
}

function makeHash($str) {
	return hash('sha256', $str);
}
