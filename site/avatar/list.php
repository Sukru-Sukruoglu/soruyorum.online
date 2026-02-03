<?php
declare(strict_types=1);

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');

try {
    $baseDir = realpath(__DIR__);
    if ($baseDir === false || !is_dir($baseDir)) {
        throw new RuntimeException('Emoji klasörü bulunamadı.');
    }

    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 500;
    $limit = max(1, min(1500, $limit));

    $flags = FilesystemIterator::SKIP_DOTS
        | FilesystemIterator::CURRENT_AS_FILEINFO
        | FilesystemIterator::FOLLOW_SYMLINKS;

    $directory = new RecursiveDirectoryIterator($baseDir, $flags);
    $iterator  = new RecursiveIteratorIterator($directory);

    $results = [];

    foreach ($iterator as $fileInfo) {
        if (!$fileInfo instanceof SplFileInfo || !$fileInfo->isFile()) {
            continue;
        }

        if (strtolower($fileInfo->getExtension()) !== 'png') {
            continue;
        }

        $relative = substr($fileInfo->getPathname(), strlen($baseDir) + 1);
        $relative = str_replace('\\', '/', $relative);

        if (!preg_match('~/3d/~i', $relative)) {
            continue; // sadece 3D klasöründeki görselleri istiyoruz
        }

        $segments = explode('/', $relative);
        $label = '';
        foreach ($segments as $i => $segment) {
            if (strcasecmp($segment, '3D') === 0 && $i > 0) {
                $label = $segments[$i - 1];
                break;
            }
        }
        if ($label === '') {
            $label = pathinfo($fileInfo->getFilename(), PATHINFO_FILENAME);
        }

        $results[] = [
            'path'     => $relative,
            'label'    => $label,
            'filename' => $fileInfo->getFilename(),
        ];

        if (count($results) >= $limit) {
            break;
        }
    }

    array_multisort(
        array_column($results, 'label'),
        SORT_NATURAL | SORT_FLAG_CASE,
        $results
    );

    echo json_encode([
        'success'      => true,
        'count'        => count($results),
        'files'        => $results,
        'generated_at' => gmdate('c'),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[emoji/list.php] ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error'   => 'Avatar listesi oluşturulamadı: ' . $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
