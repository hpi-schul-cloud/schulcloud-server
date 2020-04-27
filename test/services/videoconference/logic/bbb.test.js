const Chance = require('chance');
const chai = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
const random = new Chance();

chai.use(sinonChai);

describe('bbb', () => {
	const host = random.url({ protocol: 'https' });
	const salt = random.string();

	const createBBB = sinon.fake.returns({ bbb: true });
	const get = sinon.fake.resolves({ response: true });

	function subject(...args) {
		// We have to require the implementation module here, so mockery has a
		// chance to intercept the module's require calls for mocking.
		const bbb = require('../../../../src/services/videoconference/logic/bbb'); // eslint-disable-line global-require
		return bbb(...args);
	}

	before(() => {
		mockery.enable({ useCleanCache: true });

		mockery.registerAllowable('../../../../src/services/videoconference/logic/bbb');
		mockery.registerMock('bbb-promise', { server: createBBB });
		mockery.registerMock('bbb-promise/lib/util', { GETAction: get });
	});

	after(() => {
		mockery.deregisterAll();
		mockery.disable();
	});

	beforeEach(() => {
		createBBB.resetHistory();
		get.resetHistory();
	});

	describe('webhooks', () => {
		it('creates webhooks', async () => {
			const api = subject(host, salt);
			const params = {
				callbackURL: random.url({ protocol: 'https' }),
				meetingID: random.string(),
			};

			const result = await api.webhooks.create(params);

			expect(get).to.have.been.calledWith(host, salt, 'hooks/create', params);
			expect(result).to.deep.equal({ response: true });
		});

		it('destroys webhooks', async () => {
			const api = subject(host, salt);
			const params = { hookID: random.string() };

			const result = await api.webhooks.destroy(params);

			expect(get).to.have.been.calledWith(host, salt, 'hooks/destroy', params);
			expect(result).to.deep.equal({ response: true });
		});

		it('lists webhooks', async () => {
			const api = subject(host, salt);
			const params = { meetingID: random.string() };

			const result = await api.webhooks.list(params);

			expect(get).to.have.been.calledWith(host, salt, 'hooks/list', params);
			expect(result).to.deep.equal({ response: true });
		});
	});
});
