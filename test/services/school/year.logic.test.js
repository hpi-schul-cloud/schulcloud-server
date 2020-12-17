const chai = require('chai');
const appPromise = require('../../../src/app');
const SchoolYearFacade = require('../../../src/services/school/logic/year');
const { schoolModel: School, yearModel: YearModel } = require('../../../src/services/school/model');

const { cleanup } = require('../helpers/testObjects')(appPromise);
const { create: createSchool } = require('../helpers/services/schools')(appPromise);

const { expect } = chai;

let defaultYears;

describe('school year logic', () => {
	before('load data', async () => {
		defaultYears = await YearModel.find().lean().exec();
	});

	it('default years, and current/next year exist', () => {
		expect(defaultYears.length).is.greaterThan(1);
		const nowAsYear = String(new Date().getFullYear());
		expect(defaultYears.filter((year) => year.name.startsWith(nowAsYear)).length).to.equal(
			1,
			'the next school year should be added here and to all running systems'
		);
	});

	it('set custom year dates for testSchool', async () => {
		const yearToBeCustomized = defaultYears[0];
		const customYear = yearToBeCustomized;
		customYear.startDate = customYear.startDate.setMonth(customYear.startDate.getMonth() + 1);
		customYear.endDate = customYear.endDate.setMonth(customYear.endDate.getMonth() + 1);
		let testSchool = await createSchool({
			customYears: [
				{
					yearId: yearToBeCustomized._id,
					startDate: customYear.startDate,
					endDate: customYear.endDate,
				},
			],
		});
		const testSchoolId = testSchool._id;
		testSchool = await School.findById(testSchoolId).exec();
		const facade = new SchoolYearFacade(defaultYears, testSchool);
		const customizedYear = facade.schoolYears.filter((year) => year.name === yearToBeCustomized.name)[0];
		expect(customizedYear.startDate).equals(customYear.startDate, 'recently set start date does not match');
		expect(customizedYear.endDate).equals(customYear.endDate, 'recently set end date does not match');
	});

	describe('school year operations', async () => {
		let testSchool;
		let schoolYearFacade;
		before('create test school', async () => {
			testSchool = await createSchool();
			schoolYearFacade = new SchoolYearFacade(defaultYears, testSchool);
		});
		it('default year, which contains current or next year', () => {
			expect(schoolYearFacade.defaultYear).not.to.be.null;
		});
		it('next year exist, add migration for next year if this fails!', () => {
			expect(schoolYearFacade.nextYear).not.to.be.null;
		});
		it('last year exist', () => {
			expect(schoolYearFacade.lastYear).not.to.be.null;
		});
		it('next year after year works', () => {
			let lastYear = 0;
			schoolYearFacade.schoolYears.forEach((year) => {
				const yearNumber = parseInt(year.name, 10);
				expect(yearNumber).to.be.greaterThan(lastYear, 'values not in right order');
				lastYear = yearNumber;
			});

			const nextYear = schoolYearFacade.getNextYearAfter(schoolYearFacade.schoolYears[0]._id);
			expect(nextYear).not.to.be.null;
			expect(nextYear.name).to.equal(schoolYearFacade.schoolYears[1].name);
		});
	});

	after(cleanup);
});
