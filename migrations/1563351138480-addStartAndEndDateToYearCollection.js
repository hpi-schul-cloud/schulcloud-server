const { info } = require('../src/logger');
const { connect, close } = require('../src/utils/database');
const { yearModel: Year } = require('../src/services/school/model');

const yearLogic = require('../src/services/school/logic/year');

module.exports = {
	up: async function up() {
		await connect();
		// add startDate and endDate to all years if not defined
		const years = await Year.find().exec();
		const chain = [];
		years.forEach((year) => {
			let updated = false;

			if (!year.startDate) {
				year.startDate = yearLogic.getDefaultStartDate(year.name);
				info(
					'startDate of year "',
					year.name,
					'" will be set to',
					year.startDate,
				);
				updated = true;
			}
			if (!year.endDate) {
				year.endDate = yearLogic.getDefaultEndDate(year.name);
				info(
					'endDate of year "',
					year.name,
					'" will be set to',
					year.endDate,
				);
				updated = true;
			}
			if (updated) {
				chain.push(year.save());
			}
		});
		await Promise.all(chain);
		await close();
	},

	down: async function down() {
		throw new Error('down is not supported for this migration');
	},
};
