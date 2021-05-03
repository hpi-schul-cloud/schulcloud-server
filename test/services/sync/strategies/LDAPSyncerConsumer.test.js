const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { LDAPSyncerConsumer } = require('../../../../src/services/sync/strategies/LDAPSyncerConsumer');
const { BadRequest } = require('../../../../src/errors');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('Ldap Syncer Consumer', () => {
	const TEST_ACTION_TYPE = 'TEST_ACTION';
	class TestAction {
		getType() {
			return TEST_ACTION_TYPE;
		}

		exec(msg) {
			return `success ${msg.res}`;
		}
	}

	describe('execute message: ', () => {
		it('should execute action of the correct type', async () => {
			const ldapConsumer = new LDAPSyncerConsumer(new TestAction());
			const res = 'test message';
			const msg = {
				content: JSON.stringify({ action: TEST_ACTION_TYPE, res }),
			};
			const result = await ldapConsumer.executeMessage(msg);
			expect(result).to.be.equal(`success ${res}`);
		});

		it('should throw an error if action is of the incorrect type', async () => {
			const ldapConsumer = new LDAPSyncerConsumer();
			const msg = {
				action: TEST_ACTION_TYPE,
				content: 'test message',
			};
			expect(ldapConsumer.executeMessage(msg)).to.eventually.throw(BadRequest);
		});
	});
});
