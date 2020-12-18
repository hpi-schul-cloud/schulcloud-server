import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import rootPathImport from 'app-root-path'; 
const reqlib = rootPathImport.require;

const { BadRequest, NotFound } = reqlib('src/errors');
import appPromise from '../../../src/app';
import testObjectsImport from '../helpers/testObjects'; 
const { cleanup } = testObjectsImport(appPromise);
import schoolsImport from '../helpers/services/schools'; 
const { create: createSchool } = schoolsImport(appPromise);
import { create as createYear } from '../helpers/services/years';

chai.use(chaiAsPromised);
const { expect } = chai;

import lookupSchool from '../../../src/services/school/hooks/lookupSchool';

describe('lookupSchool hook', () => {
	it('should add the referenced school to the request params', async () => {
		const currentYear = await createYear();
		const school = await createSchool({
			currentYear,
			systems: [],
		});
		const ctx = {
			params: {
				route: {
					schoolId: school._id.toString(),
				},
			},
		};
		const result = await lookupSchool(ctx);
		expect(result).to.deep.equal(ctx);
		expect(result.params.school._id).to.deep.equal(school._id);
		expect(result.params.school.name).to.deep.equal(school.name);
	});

	it('should return BadRequest for unsuitable routes', async () => {
		const ctx = {
			params: {
				foo: 'bar',
			},
		};
		await expect(lookupSchool(ctx)).to.eventually.be.rejected.and.be.an.instanceOf(BadRequest);
	});

	it('should fail gracefully if the referenced school does not exist', () => {
		const ctx = {
			params: {
				route: {
					schoolId: '82423a327bd2739cca',
				},
			},
		};
		return expect(lookupSchool(ctx)).to.eventually.be.rejected.and.be.an.instanceOf(NotFound);
	});

	after(cleanup);
});
