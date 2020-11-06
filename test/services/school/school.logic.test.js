const chai = require('chai');
const { URL } = require('url');
const logger = require('../../../src/logger');

const appPromise = require('../../../src/app');
const { schoolModel: School, schoolGroupModel: SchoolGroup } = require('../../../src/services/school/model');
const globals = require('../../../config/globals');

const { cleanup } = require('../helpers/testObjects')(appPromise);
const { create: createSchool } = require('../helpers/services/schools')(appPromise);

const { expect } = chai;

let defaultSchool;

describe('school logic', () => {
	before('create school with group', async () => {
		const schoolGroupId = await new SchoolGroup({ name: 'defaultSchoolGroup' }).save();
		defaultSchool = await createSchool({ schoolGroupId });
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
		const path = `default/${String(school.schoolGroupId)}/`;
		const baseDir = String(new URL(path, new URL(globals.DOCUMENT_BASE_DIR)));
		expect(baseDir).contains(globals.DOCUMENT_BASE_DIR);
		expect(baseDir).contains(String(path));
		expect(school.documentBaseDir).equals(baseDir);
		logger.info('school group basedir', school.documentBaseDir);
	});

	after(cleanup);
});
