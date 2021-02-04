const axios = require('axios');
const { connect, close } = require('../src/utils/database');
const { alert, error } = require('../src/logger');

module.exports = {
	up: async function up() {
		const url = process.env.CALENDAR_URI;
		await connect();

		alert('remove duplicates process starts.');

		try {
			const result = await axios({
				method: 'delete',
				url: `${url}/events/duplicates`,
				timeout: 120000,
			});
		} catch (err) {
			error(err);
			throw err;
		}

		alert('remove duplicates process ends.');
		await close();
	},

	down: async function down() {
		alert('No rollback is exist.');
	},
};
