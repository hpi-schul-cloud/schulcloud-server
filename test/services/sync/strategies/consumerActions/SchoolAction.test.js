const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const sinon = require('sinon');
const { BadRequest } = require('../../../../../src/errors');
const { SchoolAction } = require('../../../../../src/services/sync/strategies/consumerActions');

const { SchoolRepo } = require('../../../../../src/services/sync/repo');

const appPromise = require('../../../../../src/app');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('School Actions', () => {
	let app;
	let schoolAction;

	before(async () => {
		app = await appPromise;
		schoolAction = new SchoolAction(true);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('action: ', () => {
		it('create school if not exists', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.returns(null);

			const createSchoolStub = sinon.stub(SchoolRepo, 'createSchool');

			await schoolAction.action({ name: 'Test School' });
			expect(createSchoolStub.calledOnce).to.be.true;
		});

		it('update school name for existing school', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const schoolId = 1;
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School', _id: schoolId });

			const updateSchoolStub = sinon.stub(SchoolRepo, 'updateSchoolName');

			const newSchoolName = 'New Test School';
			await schoolAction.action({ school: { name: newSchoolName } });
			expect(updateSchoolStub.calledOnce).to.be.true;
			expect(updateSchoolStub.getCall(0).firstArg).to.be.equal(schoolId);
			expect(updateSchoolStub.getCall(0).lastArg).to.be.equal(newSchoolName);
		});

		it('should throw a sync error if school repo throws an error', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.throws(new BadRequest('school repo error'));
			await expect(schoolAction.action({})).to.be.rejectedWith(BadRequest);
		});
	});
});
