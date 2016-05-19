<?php

include_once 'config.php';

$action = $_POST ['action'];

if ($action === 'write') {
	$parentId = $_POST ['parentId'];
	$textContent = $_POST ['textContent'];
	$username = $_POST ['username'];
	$password = $_POST ['password'];

	header ( "Content-Type: application/json; charset=utf-8" );
	if (invalid($parentId, $textContent)) {
		$resp['message'] = "failed, parentId or text are wrong";
		echo json_encode($resp);
		return;
	}
	
	write($parentId, $username, $password, 'comment', $textContent);

	$resp['message'] = 'success';
	echo json_encode($resp);
	return;
} else if ($action === 'edit') {
	$id = $_POST ['id'];
	$newContent = $_POST ['textContent'];
	$password = $_POST ['password'];

	header ( "Content-Type: application/json; charset=utf-8" );

	if (invalid($id, $newContent)) {
		$resp['message'] = "failed, parentId or text are wrong";
		echo json_encode($resp);
		return;
	}

	$resp['message'] = edit($id, $password, $newContent);
	echo json_encode($resp);
	return;
}

function invalid($id, $content) {
	return $id < 0 || $content == "";
}

$parent = $_GET ['p'];

if ($parent < 0) {
	return;
}
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
//TODO WISH implement search

function edit($id, $sentPass, $newContent) {
	$dbh = getDBH();
	$stmt = $dbh->prepare("SELECT `id`, `pass` FROM `" .TABLE_NAME ."` "
		."WHERE `id` == :id");
	$stmt->bindParam(':id', $id, PDO::PARAM_INT);
	$stmt->execute();
	$result = $stmt->fetchAll();

	if(count($result) == 0) {
		return "Couldn't find id";
	}

	$pass = $result[0]['pass'];

	if (makeHash(makeHash(MASTER_PASS)) == makeHash($sentPass) || makeHash($sentPass) == $pass) {
		$edit = $dbh->prepare("UPDATE `" .TABLE_NAME ."` SET `content` = :content WHERE `id` == :id");
		$edit->bindValue(':content', $newContent, PDO::PARAM_STR);
		$edit->bindParam(':id', $id, PDO::PARAM_INT);
		$edit->execute();
		return "success";
	}

	return "pass is wrong";
}

function read($parentId) {
	$dbh = getDBH();
	$stmt = $dbh->prepare("SELECT `id`, `name`, `content`, `date`, `children` FROM `" .TABLE_NAME ."`"
			." WHERE `parent` == :parent "
			." ORDER BY `date` DESC ");
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

		//update parent's children
		if($parentId > 0) {
			$stmt = $dbh->prepare("UPDATE `" .TABLE_NAME ."` SET `children` = :children WHERE `id` == :id");
			$stmt->bindValue(':children', true, PDO::PARAM_BOOL);
			$stmt->bindParam(':id', $parentId, PDO::PARAM_INT);
			$stmt->execute();
		}

		$stmt = $dbh->prepare("INSERT INTO `" .TABLE_NAME ."` (parent, name, pass, type, content, children, date)"
				."VALUES (:parent, :name, :pass, :type, :content, :children, datetime('now'))");
		$stmt->bindParam(':parent', $parentId, PDO::PARAM_INT);
		$stmt->bindParam(':name', $name, PDO::PARAM_STR);
		$stmt->bindParam(':pass', makeHash($pass), PDO::PARAM_STR);
		$stmt->bindParam(':type', $type, PDO::PARAM_STR);
		$stmt->bindParam(':content', $content, PDO::PARAM_STR);
		$stmt->bindValue(':children', false, PDO::PARAM_BOOL);
		$stmt->execute();
	} catch ( PDOException $e ) {
		print "error:" . $e->getMessage () . "<br/>";
		die ();
	}
}

function makeHash($str) {
	return hash('sha256', $str);
}
