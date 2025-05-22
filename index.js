const express = require('express');
const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const initDb = require('./db/initDB');

// Load environment variables
const result = dotenv.config();
if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}

// Initialize Express app
const app = express();
app.use(express.json());

// Bot Framework Adapter
const adapter = new BotFrameworkAdapter({
    appId: process.env.BOT_APP_ID || '',
    appPassword: process.env.BOT_APP_PASSWORD || ''
});

// Error handling for adapter
adapter.onTurnError = async (context, error) => {
    console.error(`[onTurnError] ${error}`);
    await context.sendActivity('Oops, something went wrong! Please try again.');
};

// State management
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'restaurant_bot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Bot logic
class RestaurantBot {
    constructor(conversationState, userState) {
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = this.conversationState.createProperty('DialogState');
    }

    async onTurn(context) {
        if (context.activity.type === 'message') {
            const text = context.activity.text.toLowerCase();
            const conversationData = await this.dialogState.get(context, {});

            // Check if the bot is expecting a restaurant selection (numeric input)
            if (conversationData.expectingRestaurantSelection && /^\d+$/.test(text)) {
                await this.viewMenu(context);
            } else if (text.includes('hi') || text.includes('hello')) {
                conversationData.expectingRestaurantSelection = false;
                conversationData.selectedRestaurantIndex = null; // Reset selected restaurant
                await this.dialogState.set(context, conversationData);
                await context.sendActivity('Welcome to the Restaurant Bot! How can I help you today? Type "find restaurants", "view menu", "make reservation", or "place order".');
            } else if (text.includes('find restaurants')) {
                conversationData.expectingRestaurantSelection = true;
                conversationData.selectedRestaurantIndex = null; // Reset selected restaurant
                await this.dialogState.set(context, conversationData);
                await this.findRestaurants(context);
            } else if (text.includes('view menu')) {
                conversationData.expectingRestaurantSelection = true;
                conversationData.selectedRestaurantIndex = null; // Reset selected restaurant
                await this.dialogState.set(context, conversationData);
                await this.findRestaurants(context); // Show restaurants first
            } else if (text.includes('make reservation')) {
                await this.makeReservation(context);
            } else if (text.includes('place order')) {
                await this.placeOrder(context);
            } else {
                conversationData.expectingRestaurantSelection = false;
                conversationData.selectedRestaurantIndex = null; // Reset selected restaurant
                await this.dialogState.set(context, conversationData);
                await context.sendActivity('I didn’t understand that. Try saying "find restaurants", "view menu", "make reservation", or "place order".');
            }
        }

        // Save state
        await this.conversationState.saveChanges(context);
        await this.userState.saveChanges(context);
    }

    async findRestaurants(context) {
        const [rows] = await pool.query('SELECT * FROM restaurants LIMIT 5');
        if (rows.length === 0) {
            await context.sendActivity('No restaurants found.');
            return;
        }

        let response = 'Here are some restaurants:\n';
        rows.forEach((r, i) => {
            response += `${i + 1}. ${r.name} - ${r.cuisine} in ${r.location} (Price: ${r.price_range})\n`;
        });
        response += 'Type the restaurant number to view its menu.';
        await context.sendActivity(response);

        // Store restaurant list in conversation state
        const conversationData = await this.dialogState.get(context, {});
        conversationData.restaurants = rows;
        await this.dialogState.set(context, conversationData);
    }

    async viewMenu(context) {
        const conversationData = await this.dialogState.get(context, {});
        const restaurantIndex = parseInt(context.activity.text) - 1;

        if (!conversationData.restaurants || restaurantIndex < 0 || restaurantIndex >= conversationData.restaurants.length) {
            await context.sendActivity('Please select a valid restaurant number from the list.');
            conversationData.expectingRestaurantSelection = false;
            await this.dialogState.set(context, conversationData);
            return;
        }

        const restaurantId = conversationData.restaurants[restaurantIndex].id;
        const [items] = await pool.query('SELECT * FROM menu_items WHERE restaurant_id = ?', [restaurantId]);

        if (items.length === 0) {
            await context.sendActivity('No menu items found for this restaurant.');
            conversationData.expectingRestaurantSelection = false;
            await this.dialogState.set(context, conversationData);
            return;
        }

        let response = `Menu for ${conversationData.restaurants[restaurantIndex].name}:\n`;
        items.forEach((item, i) => {
            response += `${i + 1}. ${item.name} - $${item.price} (${item.description})\n`;
        });
        response += 'Type "place order" to order or "make reservation" to book a table.';
        await context.sendActivity(response);

        // Store the selected restaurant index and reset the expectingRestaurantSelection state
        conversationData.selectedRestaurantIndex = restaurantIndex;
        conversationData.expectingRestaurantSelection = false;
        await this.dialogState.set(context, conversationData);
    }

    async makeReservation(context) {
        const conversationData = await this.dialogState.get(context, {});
        const restaurantIndex = conversationData.selectedRestaurantIndex;

        if (restaurantIndex === null || !conversationData.restaurants || restaurantIndex < 0 || restaurantIndex >= conversationData.restaurants.length) {
            await context.sendActivity('Please select a restaurant first by using "find restaurants" and choosing a number.');
            conversationData.expectingRestaurantSelection = false;
            conversationData.selectedRestaurantIndex = null;
            await this.dialogState.set(context, conversationData);
            return;
        }

        const restaurantId = conversationData.restaurants[restaurantIndex].id;
        // Simulated reservation logic
        await pool.query('INSERT INTO reservations (restaurant_id, user_id, reservation_time, party_size) VALUES (?, ?, NOW(), ?)', [restaurantId, context.activity.from.id, 4]);
        await context.sendActivity('Reservation made successfully for a party of 4! You’ll receive a confirmation soon.');

        // Reset state
        conversationData.expectingRestaurantSelection = false;
        conversationData.selectedRestaurantIndex = null;
        await this.dialogState.set(context, conversationData);
    }

    async placeOrder(context) {
        const conversationData = await this.dialogState.get(context, {});
        const restaurantIndex = conversationData.selectedRestaurantIndex;

        if (restaurantIndex === null || !conversationData.restaurants || restaurantIndex < 0 || restaurantIndex >= conversationData.restaurants.length) {
            await context.sendActivity('Please select a restaurant first by using "find restaurants" and choosing a number.');
            conversationData.expectingRestaurantSelection = false;
            conversationData.selectedRestaurantIndex = null;
            await this.dialogState.set(context, conversationData);
            return;
        }

        const restaurantId = conversationData.restaurants[restaurantIndex].id;
        // Simulated order logic
        await pool.query('INSERT INTO orders (restaurant_id, user_id, order_status) VALUES (?, ?, ?)', [restaurantId, context.activity.from.id, 'Pending']);
        await context.sendActivity('Order placed successfully! You’ll receive updates on your order status.');

        // Reset state
        conversationData.expectingRestaurantSelection = false;
        conversationData.selectedRestaurantIndex = null;
        await this.dialogState.set(context, conversationData);
    }
}

// Instantiate the bot
const bot = new RestaurantBot(conversationState, userState);

// Endpoint for bot messages
app.post('/api/messages', async (req, res) => {
    await adapter.processActivity(req, res, async (context) => {
        await bot.onTurn(context);
    });
});

// Start server and initialize database
const PORT = process.env.PORT || 3978;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    // Initialize the database
    try {
        await initDb(pool);
    } catch (err) {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    }
});