const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { SyncMessageBuilder } = require('../../../../src/services/sync/utils/SyncMessageBuilder');

const { LDAPSyncer } = require('../../../../src/services/sync/strategies/LDAPSyncer');

const { expect } = chai;
chai.use(chaiAsPromised);
const SYNC_ID = 'TEST_SYNC_ID';
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

describe('Ldap Syncer Producer', () => {
	let ldapSyncer;

	beforeEach(() => {
		ldapSyncer = new LDAPSyncer();
		ldapSyncer.system = fakeLdapSystem;
		ldapSyncer.syncQueue = new FakeSyncQueue();
		ldapSyncer.messageBuilder = new SyncMessageBuilder(SYNC_ID, fakeLdapSystem._id);
	});

	describe('createSchoolsFromLdapData', () => {
		it('should return school data', async () => {
			const result = await ldapSyncer.createSchoolsFromLdapData(exampleLdapSchoolData);
			expect(result.length).to.eql(exampleLdapSchoolData.length);
			for (let i = 0; i < result.length; i += 1) {
				expect(result[i].name).to.eql(exampleLdapSchoolData[i].displayName);
				expect(result[i].systems).to.eql([fakeLdapSystem._id]);
			}
		});
		it('should add sync messages to queue', async () => {
			await ldapSyncer.createSchoolsFromLdapData(exampleLdapSchoolData);
			const { messages } = ldapSyncer.syncQueue;
			expect(messages.length).to.eql(exampleLdapSchoolData.length);
			for (let i = 0; i < messages.length; i += 1) {
				const messageData = messages[i].data;
				expect(messageData.action).to.eql('syncSchool');
				expect(messageData.syncId).to.not.be.undefined;
				expect(messageData.data.school.name).to.eql(exampleLdapSchoolData[i].displayName);
				expect(messageData.data.school.ldapSchoolIdentifier).to.eql(exampleLdapSchoolData[i].ldapOu);
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
				expect(messageData.action).to.eql('syncUser');
				expect(messageData.syncId).to.not.be.undefined;
				expect(messageData.data.user.firstName).to.eql(exampleLdapUserData[i].firstName);
				expect(messageData.data.user.lastName).to.eql(exampleLdapUserData[i].lastName);
				expect(messageData.data.user.email).to.eql(exampleLdapUserData[i].email);
				expect(messageData.data.user.ldapDn).to.eql(exampleLdapUserData[i].ldapDn);
				expect(messageData.data.user.ldapId).to.eql(exampleLdapUserData[i].ldapUUID);
				expect(messageData.data.user.roles).to.eql(exampleLdapUserData[i].roles);

				expect(messageData.data.account.ldapDn).to.eql(exampleLdapUserData[i].ldapDn);
				expect(messageData.data.account.ldapId).to.eql(exampleLdapUserData[i].ldapUUID);
				expect(messageData.data.account.username).to.eql(`${schoolDn}/${exampleLdapUserData[i].ldapUID}`.toLowerCase());
				expect(messageData.data.account.systemId).to.eql(fakeLdapSystem._id);
				expect(messageData.data.account.schoolDn).to.eql(schoolDn);
				expect(messageData.data.account.activated).to.be.true;
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
				expect(messageData.action).to.eql('syncClasses');
				expect(messageData.syncId).to.not.be.undefined;
				expect(messageData.data.class.name).to.eql(exampleLdapClassData[i].className);
				expect(messageData.data.class.systemId).to.eql(fakeLdapSystem._id);
				expect(messageData.data.class.schoolDn).to.eql(school.ldapSchoolIdentifier);
				expect(messageData.data.class.nameFormat).to.eql('static');
				expect(messageData.data.class.ldapDN).to.eql(exampleLdapClassData[i].ldapDn);
				expect(messageData.data.class.year).to.eql(school.currentYear);
				expect(messageData.data.class.uniqueMembers).to.eql([exampleLdapClassData[i].uniqueMembers]);
			}
		});
	});
});
