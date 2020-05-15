const { info, warning } = require('../src/logger');

const { connect, close } = require('../src/utils/database');
const { yearModel: Year } = require('../src/services/school/model');
const yearLogic = require('../src/services/school/logic/year');

const YEARS_TO_ADD = ['2021/22', '2022/23', '2023/24', '2024/25', '2025/26'];

const createYear = (year) => new Year({
	name: year,
	startDate: yearLogic.getDefaultStartDate(year),
	endDate: yearLogic.getDefaultEndDate(year),
});

module.exports = {
	up: async function up() {
		await connect();
		const chain = [];
		const existingYears = await Year.find().where('name').in(YEARS_TO_ADD).exec();
		if (existingYears.length > 0) {
			warning(`some year already has been created: ${existingYears}`);
		} else {
			for (const year of YEARS_TO_ADD) {
				info(`processing ${year}`);
				const createdYear = createYear(year);
				await createdYear.save();
				chain.push(createdYear);
				info(`the year ${year} was created successfully`);
			}
		}

		await Promise.all(chain);
		info('Done.');
		await close();
	},

	down: async function down() {
		await connect();
		await Year.deleteMany({
			name: {
				$in: YEARS_TO_ADD,
			},
		});
		await close();
	},

};
