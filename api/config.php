<?php
declare(strict_types=1);
/**
 * Database configuration and small helpers for the API.
 *
 * Edit the constants below to match your environment before running the app.
 * Optionally enable DB_AUTO_MIGRATE = true to auto-create the `tasks` table
 * (useful em desenvolvimento; em produção prefira rodar migrations manualmente).
 */

/* Basic DB settings (read from env when available) */
define('DB_HOST',     getenv('DB_HOST')     ?: 'localhost');
define('DB_PORT',     getenv('DB_PORT') !== false ? (int) getenv('DB_PORT') : 3306);
define('DB_NAME',     getenv('DB_NAME')     ?: 'todolist');
define('DB_USER',     getenv('DB_USER')     ?: 'root');
define('DB_PASSWORD', getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '');
define('DB_CHARSET',  'utf8mb4');

/* Se true, o script tentará criar a tabela `tasks` automaticamente ao conectar.
   Recomendado somente em desenvolvimento. */
define('DB_AUTO_MIGRATE', getenv('DB_AUTO_MIGRATE') === '1' || getenv('DB_AUTO_MIGRATE') === 'true' ? true : false);

/* Default timezone used by the app (server-side). Use UTC to avoid timezone issues. */
date_default_timezone_set(getenv('APP_TIMEZONE') ?: 'UTC');

/**
 * Returns a PDO connection to the configured MySQL database.
 * Throws PDOException on failure.
 */
function getConnection(): PDO
{
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        DB_HOST,
        DB_PORT,
        DB_NAME,
        DB_CHARSET
    );
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, $options);

    if (DB_AUTO_MIGRATE) {
        ensureTasksTable($pdo);
    }

    return $pdo;
}

/**
 * Ensure the tasks table exists with the columns expected by the API:
 * - id, title, completed, pinned, time_spent, timer_running, timer_started_at,
 *   created_at, updated_at
 *
 * This function uses CREATE TABLE IF NOT EXISTS and is safe to call repeatedly.
 * Prefer using migrations in production.
 */
function ensureTasksTable(PDO $pdo): void
{
    $sql = <<<SQL
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(50) NOT NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `time_spent` INT NOT NULL DEFAULT 0,         -- segundos acumulados
  `timer_running` TINYINT(1) NOT NULL DEFAULT 0,
  `timer_started_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`completed`),
  INDEX (`pinned`),
  INDEX (`timer_running`),
  INDEX (`timer_started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;

    $pdo->exec($sql);
}

/**
 * Optional helper: returns the SQL that creates the tasks table.
 * Useful if you prefer to run a migration manually or via CLI.
 */
function getTasksTableCreateSQL(): string
{
    return <<<SQL
CREATE TABLE `tasks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(50)) NOT NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `time_spent` INT NOT NULL DEFAULT 0,
  `timer_running` TINYINT(1) NOT NULL DEFAULT 0,
  `timer_started_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`completed`),
  INDEX (`pinned`),
  INDEX (`timer_running`),
  INDEX (`timer_started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;
}