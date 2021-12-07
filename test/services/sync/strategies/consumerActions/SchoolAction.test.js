const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const sinon = require('sinon');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { BadRequest } = require('../../../../../src/errors');
const { SchoolAction } = require('../../../../../src/services/sync/strategies/consumerActions');

const globals = require('../../../../../config/globals');

const { SchoolRepo } = require('../../../../../src/services/sync/repo');

const { expect } = chai;
chai.use(chaiAsPromised);

describe.only('School Actions', () => {
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

			const createSchoolStub = sinon.stub(SchoolRepo, 'createSchool');
			createSchoolStub.returns({ _id: 1 });

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

		describe('when ldap school matchs by official school id with local school on BRB instance', () => {
			let originalConfiguration;

			before(() => {
				originalConfiguration = Configuration.get('FEATURE_ES_COLLECTIONS_ENABLED');
				Configuration.set('FEATURE_ES_COLLECTIONS_ENABLED', true);
			});

			after(() => {
				Configuration.set('FEATURE_ES_COLLECTIONS_ENABLED', originalConfiguration);
			});

			it('should enable user migration mode for school', async () => {
				const findSchoolByLdapIdAndSystemStub = sinon.stub(SchoolRepo, 'findSchoolByLdapIdAndSystem');
				findSchoolByLdapIdAndSystemStub.resolves(null);

				const schoolId = 1;
				sinon.stub(SchoolRepo, 'findSchoolByOfficialSchoolNumber').resolves([{ _id: schoolId }]);

				const enableUserMigrationModeStub = sinon.stub(SchoolRepo, 'enableUserMigrationMode');

				const schoolData = { ldapSchoolIdentifier: 'ldapSchoolIdentifier', systems: ['systemId'] };
				await schoolAction.action(schoolData);

				expect(enableUserMigrationModeStub.calledOnce).to.be.true;
				expect(enableUserMigrationModeStub.calledOnce).toHaveBeenCalledWith(
					schoolId,
					schoolData.ldapSchoolIdentifier,
					schoolData.systems[0]
				);
			});

			it('should fail if multiple schools with the same official school number exist locally');

			it('should create a new school if no school with the given official school number exists locally');

			it('should create a new school if the school if the ldap school does not have a school number');

			it('should not crate new school if local school is already assigned to LDAP');
		});
	});
});
