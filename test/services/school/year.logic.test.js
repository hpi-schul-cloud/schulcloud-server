const chai = require('chai');
// const app = require('../../../src/app');
const SchoolYears = require('../../../src/services/school/logic/year');
const {
	schoolModel: School,
	customYearSchema: CustomYear,
	yearModel: YearModel,
} = require('../../../src/services/school/model');

const { expect } = chai;

const testSchoolId = '0000d186816abba584714c5f';

const customStartDate = new Date('2019-09-01');
const customEndDate = new Date('2020-05-01');

let defaultYears;

describe.only('school year logic', async () => {
	before('load data', async () => {
		defaultYears = await YearModel.find().lean().exec();
	});

	it('default years, and current/next year exist', () => {
		expect(defaultYears.length).is.greaterThan(1);
		const nowAsYear = String(new Date().getFullYear());
		expect(defaultYears
			.filter(year => year.name.startsWith(nowAsYear)).length).to.be.equal(1,
			'the next school year should be added here and to all running systems');
	});

	it('set custom year dates for testSchool', async () => {
		const testSchool = await School.findById(testSchoolId).exec();
		expect(testSchool).to.not.be.null;
		const yearToBeCustomized = defaultYears.filter(year => year.name === '2019/20')[0];
		const customYear = {
			yearId: yearToBeCustomized._id,
			startDate: customStartDate,
			endDate: customEndDate,
		};
		testSchool.customYears.push(customYear);
		await testSchool.save();
	});

	it('get dates for test school', async () => {
		const testSchool = await School.findById(testSchoolId).exec();
		const schoolYears = new SchoolYears(defaultYears, testSchool);
		const customizedYear = schoolYears.getSchoolYears().filter(year => year.name === '2019/20')[0];
		expect(customizedYear.startDate).equals(customStartDate, 'recently set start date does not match');
		expect(customizedYear.endDate).equals(customEndDate, 'recently set end date does not match');
	});
});
