const { yearModel: Year } = require('../src/services/school/model');

const { connect, close } = require('../src/utils/database');
const yearLogic = require('../src/services/school/logic/year');

const logger = require('../src/logger');

const YEAR_2020_21 = '2020/21';

module.exports = {
	up: async function up() {
		await connect();
		const existingYear = await Year.findOne({ name: YEAR_2020_21 }).exec();
		if (existingYear) {
			logger.warn('the year already has been created');
		} else {
			const year = new Year({
				name: YEAR_2020_21,
				startDate: yearLogic.getDefaultStartDate(YEAR_2020_21),
				endDate: yearLogic.getDefaultEndDate(YEAR_2020_21),
			});
			await year.save();
			logger.info('the year was created successfully');
		}
		await close();
	},

	down: async function down() {
		await connect();
		await Year.deleteOne({ name: YEAR_2020_21 }).exec();
		await close();
	},
};
