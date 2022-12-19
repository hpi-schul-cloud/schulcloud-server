const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { BadRequest } = require('../../../../../src/errors');
const { SyncError } = require('../../../../../src/errors/applicationErrors');
const BaseConsumerAction = require('../../../../../src/services/sync/strategies/consumerActions/BaseConsumerAction');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('Base Actions', () => {
	const TEST_ACTION_TYPE = 'TEST_ACTION';
	const TEST_SYNC = 'TEST_SYNC';

	class TestAction extends BaseConsumerAction {
		constructor(filterActive, options) {
			super(TEST_ACTION_TYPE, options);
			this.filterActive = filterActive;
		}

		// eslint-disable-next-line no-unused-vars
		async action(data = {}) {
			throw new BadRequest(`Expected error`);
		}
	}

	describe('exec', () => {
		it('should reject the action with SyncError', async () => {
			const options = { allowedLogKeys: ['a', 'b', 'c', 'd'] };
			const testAction = new TestAction(true, options);
			const data = {
				user: {
					a: 1,
					b: 2,
					c: 3,
					firstName: 'firstName',
					lastName: 'lastName',
				},
			};
			const input = { action: TEST_ACTION_TYPE, data, syncId: TEST_SYNC };

			try {
				await testAction.exec(input);
			} catch (error) {
				expect(error).be.an.instanceOf(SyncError);
				expect(error).to.have.property('syncId', TEST_SYNC);
				expect(error.data).to.eql({ user: { a: 1, b: 2, c: 3 } });
			}
		});
	});
});
