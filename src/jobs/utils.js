const mongoose = require('mongoose');
const config = require('../../config/default.json'); // TODO change for production

async function setup() {
	await mongoose.connect(
		process.env.DB_URL || config.mongodb,
		{ user: process.env.DB_USERNAME, pass: process.env.DB_PASSWORD },
	);
}

module.exports = { setup };
