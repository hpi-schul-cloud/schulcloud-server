const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { BadRequest, NotFound } = require('../../../src/errors');
const appPromise = require('../../../src/app');
const { cleanup } = require('../helpers/testObjects')(appPromise());
const { create: createSchool } = require('../helpers/services/schools')(appPromise());
const { create: createYear } = require('../helpers/services/years');

chai.use(chaiAsPromised);
const { expect } = chai;

const lookupSchool = require('../../../src/services/school/hooks/lookupSchool');

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
		await expect(lookupSchool(ctx)).to.be.rejectedWith(BadRequest);
	});

	it('should fail gracefully if the referenced school does not exist', async () => {
		const ctx = {
			params: {
				route: {
					schoolId: '82423a327bd2739cca',
				},
			},
		};
		await expect(lookupSchool(ctx)).to.be.rejectedWith(NotFound);
	});

	after(cleanup);
});
