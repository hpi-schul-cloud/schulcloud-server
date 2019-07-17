/* eslint-disable no-console */
const { connect, close } = require('../src/utils/database');
const { yearModel: Year } = require('../src/services/school/model');

const yearLogic = require('../src/services/school/logic/year');

module.exports = {
	up: async function up() {
		// eslint-disable-next-line global-require
		await connect();
		// add startDate and endDate to all years if not defined
		const years = await Year.find().exec();
		const chain = [];
		years.forEach((year) => {
			let updated = false;

			if (!year.startDate) {
				year.startDate = yearLogic.SchoolYears.getDefaultStartDate(year.name);
				console.log('startDate of year "', year.name, '" will be set to', year.startDate);
				updated = true;
			}
			if (!year.endDate) {
				year.endDate = yearLogic.SchoolYears.getDefaultEndDate(year.name);
				console.log('endDate of year "', year.name, '" will be set to', year.endDate);
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
