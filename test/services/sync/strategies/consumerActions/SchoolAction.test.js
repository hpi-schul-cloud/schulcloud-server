const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const sinon = require('sinon');
const { BadRequest } = require('../../../../../src/errors');
const { SchoolAction } = require('../../../../../src/services/sync/strategies/consumerActions');

const { SchoolRepo } = require('../../../../../src/services/sync/repo');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('School Actions', () => {
	let schoolAction;

	before(async () => {
		schoolAction = new SchoolAction(true);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('action: ', () => {
		it('create school if not exists', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.returns(null);

			const findSchoolByOfficialSchoolNumberStub = sinon.stub(SchoolRepo, 'findSchoolByOfficialSchoolNumber');
			findSchoolByOfficialSchoolNumberStub.returns(null);

			const createSchoolStub = sinon.stub(SchoolRepo, 'createSchool');
			createSchoolStub.returns({ _id: 1 });

			await schoolAction.action({ name: 'Test School' });
			expect(createSchoolStub.calledOnce).to.be.true;
		});

		it('should not create school if non-ldap school exists', async () => {
			const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			findSchoolByLdapIdAndSystemStub.returns(null);

			const findSchoolByOfficialSchoolNumberStub = sinon.stub(SchoolRepo, 'findSchoolByOfficialSchoolNumber');
			findSchoolByOfficialSchoolNumberStub.returns({ name: 'Test School' });

			const createSchoolStub = sinon.stub(SchoolRepo, 'createSchool');

			await schoolAction.action({ school: { name: 'Test School', officialSchoolNumber: '123' } });
			expect(findSchoolByOfficialSchoolNumberStub.calledOnce).to.be.true;
			expect(createSchoolStub.calledOnce).to.be.false;
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

	describe('when school is migrated', () => {
		it('should not update school', () => {
			const findSchoolByLdapIdAndSystem = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const updateSchoolName = sinon.stub(SchoolRepo, 'updateSchoolName');
			const findSchoolByPreviousExternalIdAndSystem = sinon.stub(SchoolRepo, 'findSchoolByPreviousExternalIdAndSystem');

			findSchoolByLdapIdAndSystem.returns(null);
			findSchoolByPreviousExternalIdAndSystem.returns({ name: 'Migrated school' });

			schoolAction.action({ ldapSchoolIdentifier: 'ldapIdFromNotMigratedSystem', systems: ['systemA'] });

			expect(updateSchoolName.notCalled).to.be.true;
		});

		it('should not create school', () => {
			const findSchoolByLdapIdAndSystem = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const createSchool = sinon.stub(SchoolRepo, 'createSchool');
			const findSchoolByPreviousExternalIdAndSystem = sinon.stub(SchoolRepo, 'findSchoolByPreviousExternalIdAndSystem');

			findSchoolByLdapIdAndSystem.returns(null);
			findSchoolByPreviousExternalIdAndSystem.returns({ name: 'Migrated school' });

			expect(createSchool.notCalled).to.be.true;
		});

		it('should not check officialSchoolNumber', () => {
			const findSchoolByLdapIdAndSystem = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
			const findSchoolByOfficialSchoolNumber = sinon.stub(SchoolRepo, 'findSchoolByOfficialSchoolNumber');
			const findSchoolByPreviousExternalIdAndSystem = sinon.stub(SchoolRepo, 'findSchoolByPreviousExternalIdAndSystem');

			findSchoolByLdapIdAndSystem.returns(null);
			findSchoolByPreviousExternalIdAndSystem.returns({ name: 'Migrated school' });

			schoolAction.action({
				ldapSchoolIdentifier: 'ldapIdFromNotMigratedSystem',
				systems: ['systemA'],
				officialSchoolNumber: '00100',
			});

			expect(findSchoolByOfficialSchoolNumber.notCalled).to.be.true;
		});
	});
});
