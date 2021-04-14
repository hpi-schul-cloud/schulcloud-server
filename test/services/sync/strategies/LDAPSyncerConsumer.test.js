const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const sinon = require('sinon');

const { LDAP_SYNC_ACTIONS } = require('../../../../src/services/sync/strategies/LDAPSyncer');
const { LDAPSyncerConsumer } = require('../../../../src/services/sync/strategies/LDAPSyncerConsumer');
const { SchoolRepo, ClassRepo, UserRepo, AccountRepo } = require('../../../../src/services/sync/repo');
const { BadRequest } = require('../../../../src/errors');

const appPromise = require('../../../../src/app');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('Ldap Syncer Consumer', () => {
	let app;
	let sandbox;

	before(async () => {
		app = await appPromise;
	});

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('execute message: ', () => {
		let ldapConsumer;

		before(() => {
			const schoolRepo = new SchoolRepo(app);
			ldapConsumer = new LDAPSyncerConsumer(schoolRepo);
		});

		it('should execute sync school action', async () => {
			const schoolActionStub = sandbox.stub(ldapConsumer, 'schoolAction');
			const content = { action: LDAP_SYNC_ACTIONS.SYNC_SCHOOL, syncId: 'someId', data: {} };
			const message = { content: JSON.stringify(content) };
			await ldapConsumer.executeMessage(message);
			expect(schoolActionStub.calledOnce).to.be.true;
		});

		it('should execute sync user action', async () => {
			const userActionStub = sandbox.stub(ldapConsumer, 'userAction');
			const content = { action: LDAP_SYNC_ACTIONS.SYNC_USER, syncId: 'someId', data: {} };
			const message = { content: JSON.stringify(content) };
			await ldapConsumer.executeMessage(message);
			expect(userActionStub.calledOnce).to.be.true;
		});

		it('should execute sync classes action', async () => {
			const classActionStub = sandbox.stub(ldapConsumer, 'classAction');
			const content = { action: LDAP_SYNC_ACTIONS.SYNC_CLASSES, syncId: 'someId', data: {} };
			const message = { content: JSON.stringify(content) };
			await ldapConsumer.executeMessage(message);
			expect(classActionStub.calledOnce).to.be.true;
		});

		it('should throw a BadRequest for unknown action', async () => {
			const content = { action: 'UNKNOWN', syncId: 'someId', data: {} };
			const message = { content: JSON.stringify(content) };
			expect(ldapConsumer.executeMessage(message)).to.eventually.throw(BadRequest);
		});
	});

	describe('schoolAction: ', () => {
		it('create school for new school', async () => {
			const schoolRepo = new SchoolRepo(app);
			const findByLdapIdAndSystemStub = sandbox.stub(schoolRepo, 'findByLdapIdAndSystem');
			findByLdapIdAndSystemStub.returns(undefined);

			const createSchoolStub = sandbox.stub(schoolRepo, 'create');

			const ldapConsumer = new LDAPSyncerConsumer(schoolRepo);
			const result = await ldapConsumer.schoolAction({ name: 'Test School' });
			expect(result).to.be.equal(true);
			expect(createSchoolStub.calledOnce).to.be.true;
		});

		it('update school name for existing school', async () => {
			const schoolRepo = new SchoolRepo(app);
			const findByLdapIdAndSystemStub = sandbox.stub(schoolRepo, 'findByLdapIdAndSystem');
			const schoolId = 1;
			findByLdapIdAndSystemStub.returns({ name: 'Test School', _id: schoolId });

			const updateSchoolStub = sandbox.stub(schoolRepo, 'updateName');

			const ldapConsumer = new LDAPSyncerConsumer(schoolRepo);
			const newSchoolName = 'New Test School';
			const result = await ldapConsumer.schoolAction({ name: newSchoolName });
			expect(result).to.be.equal(true);
			expect(updateSchoolStub.calledOnce).to.be.true;
			expect(updateSchoolStub.getCall(0).firstArg).to.be.equal(schoolId);
			expect(updateSchoolStub.getCall(0).lastArg).to.be.equal(newSchoolName);
		});
	});
});
