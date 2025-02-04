<?php
// Чтение файла с результатами
$scores = file_exists('scores.txt') ? file('scores.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) : [];
$scoresArr = [];

foreach ($scores as $line) {
    list($name, $score) = explode(",", $line);
    $scoresArr[] = ['name' => $name, 'score' => intval($score)];
}

// Сортируем записи по убыванию счёта
usort($scoresArr, function($a, $b) {
    return $b['score'] - $a['score'];
});
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Scoreboard</title>
    <style>
        body { font-family: Arial, sans-serif; background: #000; color: #0ff; text-align: center; }
        table { margin: auto; border-collapse: collapse; }
        th, td { border: 1px solid #0ff; padding: 8px 12px; }
        th { background: #222; }
        a.button { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #222; border: 2px solid #0ff; color: #0ff; text-decoration: none; }
    </style>
</head>
<body>
    <h1>Scoreboard</h1>
    <table>
        <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
        </tr>
        <?php foreach($scoresArr as $index => $item): ?>
        <tr>
            <td><?php echo $index + 1; ?></td>
            <td><?php echo htmlspecialchars($item['name']); ?></td>
            <td><?php echo $item['score']; ?></td>
        </tr>
        <?php endforeach; ?>
    </table>
    <a class="button" href="game.html">Back to Game</a>
</body>
</html>
