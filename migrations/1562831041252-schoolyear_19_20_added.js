const { yearModel: Year } = require('../src/services/school/model');

const { connect, close } = require('../src/utils/database');
const yearLogic = require('../src/services/school/logic/year');

const logger = require('../src/logger');

const YEAR_2019_20 = '2019/20';

module.exports = {
	up: async function up() {
		await connect();
		const existingYear = await Year.findOne({ name: YEAR_2019_20 }).exec();
		if (existingYear) {
			logger.warning('the year already has been created');
		} else {
			const year = new Year({
				name: YEAR_2019_20,
				startDate: yearLogic.getDefaultStartDate(YEAR_2019_20),
				endDate: yearLogic.getDefaultEndDate(YEAR_2019_20),
			});
			await year.save();
			logger.info('the year was created successfully');
		}
		await close();
	},

	down: async function down() {
		await connect();
		await Year.deleteOne({ name: YEAR_2019_20 }).exec();
		await close();
	},
};
