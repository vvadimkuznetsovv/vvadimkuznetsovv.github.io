<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Получаем и фильтруем данные
    $name  = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : 'Anonymous';
    $score = isset($_POST['score']) ? intval($_POST['score']) : 0;
    
    // Формат записи (например, CSV)
    $record = $name . "," . $score . "\n";
    
    // Дописываем запись в файл (файл должен иметь права на запись)
    file_put_contents('scores.txt', $record, FILE_APPEND | LOCK_EX);
    
    echo "success";
} else {
    echo "Invalid request.";
}
?>
