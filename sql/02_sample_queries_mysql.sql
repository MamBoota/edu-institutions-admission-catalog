-- Примеры запросов для отчёта УП.11 (MySQL / MariaDB), после наполнения данными.

-- 1) SELECT с условием
-- SELECT id, name FROM institutions WHERE city_id = 1;

-- 2) INSERT
-- INSERT INTO cities (name, slug) VALUES ('Тюмень', 'tyumen');

-- 3) UPDATE
-- UPDATE institutions SET description = 'Обновлённое описание' WHERE id = 1;

-- 4) DELETE
-- DELETE FROM reviews WHERE id = 1;

-- 5) SELECT с JOIN
SELECT c.name AS city_name,
       ROUND(AVG(r.rating), 2) AS avg_rating,
       COUNT(r.id) AS review_count
FROM cities c
LEFT JOIN institutions i ON i.city_id = c.id
LEFT JOIN reviews r ON r.institution_id = i.id
GROUP BY c.id, c.name
ORDER BY c.name;
