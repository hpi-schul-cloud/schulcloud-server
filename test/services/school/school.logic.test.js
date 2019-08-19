const chai = require('chai');
const { URL } = require('url');
const logger = require('../../../src/logger');

const app = require('../../../src/app');
const {
	schoolModel: School,
	schoolGroupModel: SchoolGroup,
} = require('../../../src/services/school/model');
const globals = require('../../../config/globals');

const { cleanup } = require('../helpers/testObjects')(app);
const { create: createSchool } = require('./../helpers/services/schools')(app);

const { expect } = chai;

let defaultSchool;

describe('school logic', async () => {
	before('create school with group', async () => {
		const schoolGroup = await new SchoolGroup({ name: 'defaultSchoolGroup' }).save();
		defaultSchool = await createSchool({ schoolGroup });
	});

	it('get default documentBaseDir', async () => {
		const school = await School.findById(defaultSchool._id);
		const baseDir = String(new URL('default/', new URL(globals.DOCUMENT_BASE_DIR)));
		expect(baseDir).contains(globals.DOCUMENT_BASE_DIR);
		expect(school.documentBaseDir).equals(baseDir);
		logger.info('school basedir', school.documentBaseDir);
	});


	it('get school documentBaseDir', async () => {
		const school = await School.findById(defaultSchool._id);
		school.documentBaseDirType = 'school';
		await school.save();
		const path = `default/${String(school._id)}/`;
		const baseDir = String(new URL(String(path), new URL(globals.DOCUMENT_BASE_DIR)));
		expect(baseDir).contains(globals.DOCUMENT_BASE_DIR);
		expect(baseDir).contains(String(path));
		expect(school.documentBaseDir).equals(baseDir);
		logger.info('school basedir', school.documentBaseDir);
	});

	it('get schoolgroup documentBaseDir', async () => {
		const school = await School.findById(defaultSchool._id);
		school.documentBaseDirType = 'schoolGroup';
		await school.save();
		const path = `default/${String(school.schoolGroup)}/`;
		const baseDir = String(new URL(path, new URL(globals.DOCUMENT_BASE_DIR)));
		expect(baseDir).contains(globals.DOCUMENT_BASE_DIR);
		expect(baseDir).contains(String(path));
		expect(school.documentBaseDir).equals(baseDir);
		logger.info('school group basedir', school.documentBaseDir);
	});

	// it('set custom year dates for testSchool', async () => {
	// 	const yearToBeCustomized = defaultSchools[0];
	// 	const customYear = yearToBeCustomized;
	// 	customYear.startDate = customYear.startDate.setMonth(customYear.startDate.getMonth() + 1);
	// 	customYear.endDate = customYear.endDate.setMonth(customYear.endDate.getMonth() + 1);
	// 	let testSchool = await createSchool({
	// 		customYears: [{
	// 			yearId: yearToBeCustomized._id,
	// 			startDate: customYear.startDate,
	// 			endDate: customYear.endDate,
	// 		}],
	// 	});
	// 	const testSchoolId = testSchool._id;
	// 	testSchool = await School.findById(testSchoolId).exec();
	// 	const facade = new SchoolYearFacade(defaultYears, testSchool);
	// 	const customizedYear = facade.schoolYears.filter(year => year.name === yearToBeCustomized.name)[0];
	// 	expect(customizedYear.startDate).equals(customYear.startDate, 'recently set start date does not match');
	// 	expect(customizedYear.endDate).equals(customYear.endDate, 'recently set end date does not match');
	// });

	// describe('school year operations', async () => {
	// 	let testSchool; let schoolYearFacade;
	// 	before('create test school', async () => {
	// 		testSchool = await createSchool();
	// 		schoolYearFacade = new SchoolYearFacade(defaultYears, testSchool);
	// 	});
	// 	it('default year, which contains current or next year', () => {
	// 		expect(schoolYearFacade.defaultYear).not.to.be.null;
	// 	});
	// 	it('next year exist, add migration for next year if this fails!', () => {
	// 		expect(schoolYearFacade.nextYear).not.to.be.null;
	// 	});
	// 	it('last year exist', () => {
	// 		expect(schoolYearFacade.lastYear).not.to.be.null;
	// 	});
	// 	it('next year after year works', () => {
	// 		let lastYear = 0;
	// 		schoolYearFacade.schoolYears.forEach((year) => {
	// 			const yearNumber = parseInt(year.name, 10);
	// 			expect(yearNumber).to.be.greaterThan(lastYear, 'values not in right order');
	// 			lastYear = yearNumber;
	// 		});

	// 		const nextYear = schoolYearFacade.getNextYearAfter(schoolYearFacade.schoolYears[0]._id);
	// 		expect(nextYear).not.to.be.null;
	// 		expect(nextYear.name).to.equal(schoolYearFacade.schoolYears[1].name);
	// 	});
	// });

	after(cleanup);
});
