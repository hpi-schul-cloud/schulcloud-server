const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { generateObjectId } = require('../../helpers/testObjects');

const { LDAPSyncer } = require('../../../../src/services/sync/strategies/LDAPSyncer');

const { expect } = chai;
chai.use(chaiAsPromised);

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

describe.only('Ldap Syncer Producer', () => {
	let ldapSyncer;

	beforeEach(() => {
		ldapSyncer = new LDAPSyncer();
		ldapSyncer.system = fakeLdapSystem;
		ldapSyncer.syncQueue = new FakeSyncQueue();
	});

	describe('createSchoolsFromLdapData', () => {
		it('should return school data', async () => {
			const result = await ldapSyncer.createSchoolsFromLdapData(exampleLdapSchoolData);
			expect(result.length).to.eql(exampleLdapSchoolData.length);
			for (let i = 0; i < result.length; i++) {
				expect(result[i].name).to.eql(exampleLdapSchoolData[i].displayName);
				expect(result[i].systems).to.eql([fakeLdapSystem._id]);
			}
		});
		it('should add sync messages to queue', async () => {
			await ldapSyncer.createSchoolsFromLdapData(exampleLdapSchoolData);
			const { messages } = ldapSyncer.syncQueue;
			expect(messages.length).to.eql(exampleLdapSchoolData.length);
		});
	});
});
