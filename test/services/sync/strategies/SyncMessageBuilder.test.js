const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const {
	SyncMessageBuilder,
	LDAP_SYNC_ACTIONS,
} = require('../../../../src/services/sync/strategies/SyncMessageBuilder');

const { expect } = chai;
chai.use(chaiAsPromised);
const SYNC_ID = 'TEST_SYNC_ID';
const currentYear = '2021';
const federalState = 'NI';

const exampleSchoolData = {
	displayName: 'test school',
	ldapOu: 'test ldap school id',
};

const exampleClassData = {
	className: 'exampleClass',
	ldapDn: 'ldapDn',
	uniqueMembers: 'uniqueMember',
};

const exampleUserData = {
	firstName: 'firstName1',
	lastName: 'lastName1',
	email: 'test1@example.com',
	ldapDn: 'ldapDn1',
	ldapUUID: 'ldapId1',
	ldapUID: 'ldapUID1',
	roles: ['student'],
};

const fakeLdapSystem = {
	_id: '123456789',
	alias: 'FakeSystem',
};

describe('Sync Message Builder', () => {
	let messageBuilder;
	before(() => {
		messageBuilder = new SyncMessageBuilder(SYNC_ID, fakeLdapSystem._id);
	});
	describe('createSyncMessage', () => {
		it('should create sync message', () => {
			const data = { key: 'some data' };
			const action = LDAP_SYNC_ACTIONS.SYNC_SCHOOL;
			const result = messageBuilder.createSyncMessage(action, data);
			expect(result.action).to.be.equal(action);
			expect(result.syncId).to.be.equal(SYNC_ID);
			expect(result.data).to.eql(data);
		});
	});

	describe('createSchoolDataMessage', () => {
		it('should create message for school', () => {
			const expectedResult = {
				syncId: SYNC_ID,
				action: LDAP_SYNC_ACTIONS.SYNC_SCHOOL,
				data: {
					school: {
						name: exampleSchoolData.displayName,
						systems: [fakeLdapSystem._id],
						ldapSchoolIdentifier: exampleSchoolData.ldapOu,
						currentYear,
						federalState,
					},
				},
			};
			expect(messageBuilder.createSchoolDataMessage(exampleSchoolData, currentYear, federalState)).to.eql(
				expectedResult
			);
		});
	});

	describe('createClassDataMessage', () => {
		it('should create class message', () => {
			const inputSchool = {
				ldapSchoolIdentifier: exampleSchoolData.ldapOu,
				currentYear,
			};

			const expectedResult = {
				syncId: SYNC_ID,
				action: LDAP_SYNC_ACTIONS.SYNC_CLASSES,
				data: {
					class: {
						name: exampleClassData.className,
						systemId: fakeLdapSystem._id,
						schoolDn: inputSchool.ldapSchoolIdentifier,
						nameFormat: 'static',
						ldapDN: exampleClassData.ldapDn,
						year: inputSchool.currentYear,
						uniqueMembers: [exampleClassData.uniqueMembers],
					},
				},
			};
			expect(messageBuilder.createClassDataMessage(exampleClassData, inputSchool)).to.eql(expectedResult);
		});
	});

	describe('createUserDataMessage', () => {
		it('should create user message', () => {
			const expectedResult = {
				syncId: SYNC_ID,
				action: LDAP_SYNC_ACTIONS.SYNC_USER,
				data: {
					user: {
						firstName: exampleUserData.firstName,
						lastName: exampleUserData.lastName,
						systemId: fakeLdapSystem._id,
						schoolDn: exampleSchoolData.ldapOu,
						email: exampleUserData.email,
						ldapDn: exampleUserData.ldapDn,
						ldapId: exampleUserData.ldapUUID,
						roles: exampleUserData.roles,
					},
					account: {
						ldapDn: exampleUserData.ldapDn,
						ldapId: exampleUserData.ldapUUID,
						username: `${exampleSchoolData.ldapOu}/${exampleUserData.ldapUID}`.toLowerCase(),
						systemId: fakeLdapSystem._id,
						schoolDn: exampleSchoolData.ldapOu,
						activated: true,
					},
				},
			};
			expect(messageBuilder.createUserDataMessage(exampleUserData, exampleSchoolData.ldapOu)).to.eql(expectedResult);
		});
	});
});
