const mysql = require('mysql2/promise');

async function initDb(pool) {
    try {
        // Create tables if they don't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS restaurants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                cuisine VARCHAR(100),
                location VARCHAR(255),
                price_range VARCHAR(50)
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS menu_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                restaurant_id INT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2),
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reservations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                restaurant_id INT,
                user_id VARCHAR(255),
                reservation_time DATETIME,
                party_size INT,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                restaurant_id INT,
                user_id VARCHAR(255),
                order_status VARCHAR(50),
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
            );
        `);

        // Check if the restaurants table already has data
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM restaurants');
        const restaurantCount = rows[0].count;

        // Only insert sample data if the restaurants table is empty
        if (restaurantCount === 0) {
            await pool.query(`
                INSERT INTO restaurants (name, cuisine, location, price_range) VALUES
                ('Pizza Palace', 'Italian', 'Downtown', '$$'),
                ('Sushi Haven', 'Japanese', 'Midtown', '$$$'),
                ('Taco Fiesta', 'Mexican', 'Uptown', '$');
            `);

            await pool.query(`
                INSERT INTO menu_items (restaurant_id, name, description, price) VALUES
                (1, 'Margherita Pizza', 'Classic pizza with tomato and mozzarella', 12.99),
                (1, 'Pepperoni Pizza', 'Pepperoni and cheese', 14.99),
                (2, 'California Roll', 'Crab, avocado, and cucumber', 8.99),
                (2, 'Spicy Tuna Roll', 'Tuna with spicy mayo', 9.99),
                (3, 'Chicken Tacos', 'Grilled chicken with salsa', 6.99);
            `);

            console.log('Database initialized with sample data.');
        } else {
            console.log('Database already initialized. Skipping sample data insertion.');
        }
    } catch (err) {
        console.error('Database initialization error:', err);
        throw err; // Re-throw the error to handle it in the calling code
    }
}

module.exports = initDb;