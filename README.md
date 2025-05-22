# Restaurant Bot

## Overview
Restaurant Bot is a Node.js-based chatbot built with the Microsoft Bot Framework. It enables users to:
- Find restaurants by listing available options.
- View menus for selected restaurants.
- Make reservations for a party of 4.
- Place orders with status updates.

The bot uses a MySQL database to manage restaurant data, menu items, reservations, and orders. It can be tested locally using the Bot Framework Emulator.

## Prerequisites
- **Node.js** (v14 or higher) and npm
- **MySQL** (v8.0 or higher) installed and running
- **Bot Framework Emulator** (v4.15.1 or higher) for testing
- Git (to clone the repository)

## Setup Instructions

### 1. Clone the Repository
Clone the project to your local machine:
```bash
git clone https://github.com/vasundra-172/Restaurant-Bot.git
cd restaurant-bot
```

### 2. Install Dependencies
Install the required Node.js packages:
```bash
npm install
```

### 3. Configure the Database
- Ensure MySQL is running on your machine.
- Create a database named `restaurant_bot`:
  ```sql
  CREATE DATABASE restaurant_bot;
  ```
- The database schema and sample data will be automatically initialized when you run the application.

### 4. Set Up Environment Variables
- Create a `.env` file in the root directory:
  ```bash
  touch .env
  ```
- Add the following environment variables to the `.env` file:
  ```
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=your_mysql_password
  DB_NAME=restaurant_bot
  PORT=3978
  ```
  Replace `your_mysql_password` with your MySQL root password.

### 5. Run the Application
Start the bot server:
```bash
node index.js
```
The server will run on `http://localhost:3978`.

### 6. Test the Bot with Bot Framework Emulator
- Download and install the Bot Framework Emulator (v4.15.1 or higher) from [GitHub](https://github.com/Microsoft/BotFramework-Emulator/releases).
- Open the Emulator and click **Open Bot**.
- Enter the following Bot URL:
  ```
  http://localhost:3978/api/messages
  ```
- Leave the Microsoft App ID and Password fields blank (for local testing).
- Click **Connect**.

### 7. Interact with the Bot
- Type `hi` to start the conversation.
- Use commands like:
  - `find restaurants` to list available restaurants.
  - Enter a number (e.g., `1`) to view the menu of a restaurant.
  - `make reservation` to book a table for a party of 4.
  - `place order` to place an order.

## Project Structure
- `index.js`: Main bot logic and server setup.
- `db/initDb.js`: Database initialization script.
- `.env`: Environment variables (not tracked in Git).
- `package.json`: Project dependencies.

## Notes
- Ensure `.env` is added to `.gitignore` to prevent exposing sensitive data.
- Rotate database credentials if they are ever exposed.
- For production deployment, configure Microsoft App ID and Password for the Bot Framework.

## Troubleshooting
- **Database Connection Issues**: Verify MySQL credentials in `.env` and ensure the `restaurant_bot` database exists.
- **Port Conflicts**: If port `3978` is in use, change the `PORT` in `.env` and update the Emulator configuration.
- **Bot Not Responding**: Check the terminal for errors and ensure the Emulator is connected to the correct URL.

Database Connection Issues: Verify MySQL credentials in .env and ensure the restaurant_bot database exists.
Port Conflicts: If port 3978 is in use, change the PORT in .env and update the Emulator configuration.
Bot Not Responding: Check the terminal for errors and ensure the Emulator is connected to the correct URL.

