const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { SyncMessageBuilder } = require('../../../../src/services/sync/strategies/SyncMessageBuilder');

const { LDAPSyncer } = require('../../../../src/services/sync/strategies/LDAPSyncer');

const { expect } = chai;
chai.use(chaiAsPromised);
const SYNC_ID = 'TEST_SYNC_ID';

const currentYear = '2021/22';

const federalState = 'NI';

const exampleLdapSchoolData = [
	{
		displayName: 'school1',
		ldapOu: 'ldapOu',
	},
	{
		displayName: 'school2',
		ldapOu: 'ldapOu',
	},
	{
		displayName: 'school2',
		ldapOu: 'ldapOu',
	},
];

const exampleLdapUserData = [
	{
		firstName: 'firstName1',
		lastName: 'lastName1',
		email: 'test1@example.com',
		ldapDn: 'ldapDn1',
		ldapUID: 'ldapUID1',
		ldapUUID: 'ldapUUID1',
		roles: ['student'],
	},
	{
		firstName: 'firstName2',
		lastName: 'lastName2',
		email: 'test2@example.com',
		ldapDn: 'ldapDn2',
		ldapUID: 'ldapUID2',
		ldapUUID: 'ldapUUID2',
		roles: ['teacher'],
	},
];

const exampleLdapClassData = [
	{
		name: 'exampleClass',
		ldapDN: 'ldapDn',
		uniqueMembers: 'uniqueMember',
	},
];

const fakeLdapSystem = {
	_id: '123456789',
	alias: 'FakeSystem',
};

class FakeSyncQueue {
	constructor() {
		this.messages = [];
	}

	sendToQueue(data, options) {
		this.messages.push({ data, options });
	}
}

class FakeLdapService {
	getSchools(ldapConfig) {
		return exampleLdapSchoolData;
	}

	getClasses(ldapConfig, school) {
		return exampleLdapClassData;
	}

	getUsers(ldapConfig, school) {
		return exampleLdapUserData;
	}
}

describe('Ldap Syncer Producer', () => {
	let ldapSyncer;

	beforeEach(() => {
		ldapSyncer = new LDAPSyncer();
		ldapSyncer.system = fakeLdapSystem;
		ldapSyncer.syncQueue = new FakeSyncQueue();
		ldapSyncer.messageBuilder = new SyncMessageBuilder(SYNC_ID, fakeLdapSystem._id);
		ldapSyncer.ldapService = new FakeLdapService();
	});

	describe('sendLdapSchools', () => {
		it('should return school data', async () => {
			const result = await ldapSyncer.sendLdapSchools(exampleLdapSchoolData, currentYear, federalState);
			expect(result.length).to.eql(exampleLdapSchoolData.length);
			for (let i = 0; i < result.length; i += 1) {
				expect(result[i].name).to.eql(exampleLdapSchoolData[i].displayName);
				expect(result[i].systems).to.eql([fakeLdapSystem._id]);
			}
		});
		it('should add correct formatted sync messages to queue', async () => {
			await ldapSyncer.sendLdapSchools(exampleLdapSchoolData, currentYear, federalState);
			const { messages } = ldapSyncer.syncQueue;
			expect(messages.length).to.eql(exampleLdapSchoolData.length);
			for (let i = 0; i < messages.length; i += 1) {
				const messageData = messages[i].data;
				const exampleLdapSchool = exampleLdapSchoolData[i];
				const expectedResult = ldapSyncer.messageBuilder.createSchoolDataMessage(
					exampleLdapSchool,
					currentYear,
					federalState
				);
				expect(messageData).to.be.eql(expectedResult);
			}
		});
	});

	describe('sendUserData', () => {
		it('should add sync messages to queue', async () => {
			const schoolDn = 'schoolDn';
			await ldapSyncer.sendLdapUsers(exampleLdapUserData, schoolDn);
			const { messages } = ldapSyncer.syncQueue;
			expect(messages.length).to.eql(exampleLdapUserData.length);
			for (let i = 0; i < messages.length; i += 1) {
				const messageData = messages[i].data;
				const expectedResult = ldapSyncer.messageBuilder.createUserDataMessage(exampleLdapUserData[i], schoolDn);
				expect(messageData).to.be.eql(expectedResult);
			}
		});
	});

	describe('sendClassData', () => {
		it('should add sync messages to queue', async () => {
			const school = { ldapSchoolIdentifier: 'schoolDn', currentYear: 'currentYear' };
			await ldapSyncer.sendLdapClasses(exampleLdapClassData, school);
			const { messages } = ldapSyncer.syncQueue;
			expect(messages.length).to.eql(1);
			for (let i = 0; i < messages.length; i += 1) {
				const messageData = messages[i].data;
				const expectedResult = ldapSyncer.messageBuilder.createClassDataMessage(exampleLdapClassData[i], school);
				expect(messageData).to.be.eql(expectedResult);
			}
		});
	});
});
