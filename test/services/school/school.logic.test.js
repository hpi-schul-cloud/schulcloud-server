const chai = require('chai');
const { URL } = require('url');
const { Configuration } = require('@hpi-schul-cloud/commons');

const logger = require('../../../src/logger');

const appPromise = require('../../../src/app');
const { schoolModel: School, schoolGroupModel: SchoolGroup } = require('../../../src/services/school/model');

const { cleanup } = require('../helpers/testObjects')(appPromise);
const { create: createSchool } = require('../helpers/services/schools')(appPromise);

const { expect } = chai;

describe('school logic', () => {
	let defaultSchool;
	const DOCUMENT_BASE_DIR = Configuration.get('DOCUMENT_BASE_DIR');

	before('create school with group', async () => {
		const schoolGroupId = await new SchoolGroup({ name: 'defaultSchoolGroup' }).save();
		defaultSchool = await createSchool({ schoolGroupId });
	});

	it('get default documentBaseDir', async () => {
		const school = await School.findById(defaultSchool._id);
		const baseDir = String(new URL('default/', new URL(DOCUMENT_BASE_DIR)));
		expect(baseDir).contains(DOCUMENT_BASE_DIR);
		expect(school.documentBaseDir).equals(baseDir);
		logger.info('school basedir', school.documentBaseDir);
	});

	it('get school documentBaseDir', async () => {
		const school = await School.findById(defaultSchool._id);
		school.documentBaseDirType = 'school';
		await school.save();
		const path = `default/${String(school._id)}/`;
		const baseDir = String(new URL(String(path), new URL(DOCUMENT_BASE_DIR)));
		expect(baseDir).contains(DOCUMENT_BASE_DIR);
		expect(baseDir).contains(String(path));
		expect(school.documentBaseDir).equals(baseDir);
		logger.info('school basedir', school.documentBaseDir);
	});

	it('get schoolgroup documentBaseDir', async () => {
		const school = await School.findById(defaultSchool._id);
		school.documentBaseDirType = 'schoolGroup';
		await school.save();
		const path = `default/${String(school.schoolGroupId)}/`;
		const baseDir = String(new URL(path, new URL(DOCUMENT_BASE_DIR)));
		expect(baseDir).contains(DOCUMENT_BASE_DIR);
		expect(baseDir).contains(String(path));
		expect(school.documentBaseDir).equals(baseDir);
		logger.info('school group basedir', school.documentBaseDir);
	});

	after(cleanup);
});
