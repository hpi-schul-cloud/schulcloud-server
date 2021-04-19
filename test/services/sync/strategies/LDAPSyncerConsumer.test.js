const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const sinon = require('sinon');
const proxyquire = require('proxyquire');

const { LDAP_SYNC_ACTIONS } = require('../../../../src/services/sync/strategies/LDAPSyncer');
const { LDAPSyncerConsumer } = require('../../../../src/services/sync/strategies/LDAPSyncerConsumer');
const { BadRequest } = require('../../../../src/errors');
const {
	createSchool,
	updateSchoolName,
	findSchoolByLdapIdAndSystem,
} = require('../../../../src/services/sync/repo/school.repo');

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
			ldapConsumer = new LDAPSyncerConsumer();
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
			const findSchoolByLdapIdAndSystemStub = sandbox.stub(findSchoolByLdapIdAndSystem);
			findSchoolByLdapIdAndSystemStub.returns(undefined);

			const createSchoolStub = sandbox.stub(createSchool);

			const ldapConsumer = new LDAPSyncerConsumer();
			const result = await ldapConsumer.schoolAction({ name: 'Test School' });
			expect(result).to.be.equal(true);
			expect(createSchoolStub.calledOnce).to.be.true;
		});

		it('update school name for existing school', async () => {
			const findSchoolByLdapIdAndSystemStub = sandbox.stub(findSchoolByLdapIdAndSystem);
			const schoolId = 1;
			findSchoolByLdapIdAndSystemStub.returns({ name: 'Test School', _id: schoolId });

			const updateSchoolStub = sandbox.stub(updateSchoolName);

			const ldapConsumer = new LDAPSyncerConsumer();
			const newSchoolName = 'New Test School';
			const result = await ldapConsumer.schoolAction({ name: newSchoolName });
			expect(result).to.be.equal(true);
			expect(updateSchoolStub.calledOnce).to.be.true;
			expect(updateSchoolStub.getCall(0).firstArg).to.be.equal(schoolId);
			expect(updateSchoolStub.getCall(0).lastArg).to.be.equal(newSchoolName);
		});
	});
});
