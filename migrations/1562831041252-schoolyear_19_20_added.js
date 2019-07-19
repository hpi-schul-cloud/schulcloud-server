const { yearModel: Year } = require('../src/services/school/model');

const { connect, close } = require('../src/utils/database');
const yearLogic = require('../src/services/school/logic/year');

const YEAR_2019_20 = '2019/20';

module.exports = {
	up: async function up() {
		await connect();
		const year = new Year({
			name: YEAR_2019_20,
			startDate: yearLogic.getDefaultStartDate(YEAR_2019_20),
			endDate: yearLogic.getDefaultEndDate(YEAR_2019_20),
		});
		await year.save();
		await close();
	},

	down: async function down() {
		await connect();
		await Year.deleteOne({ name: YEAR_2019_20 }).exec();
		await close();
	},
};
