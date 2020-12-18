import assert from 'assert';
import mockery from 'mockery';
import chai from 'chai';
import requestMock from './mock/mockResponses';

const { expect } = chai;

describe('notification service', function () {
	this.timeout(20000); // for slow require(app) call

	let app = null;
	let notificationService = null;

	before(async () => {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('request-promise-native', requestMock);
		// eslint-disable-next-line global-require
		app = await (await import('../../../src/app')).default;
		app.setup();
		notificationService = app.service('notification');
	});

	after((done) => {
		mockery.deregisterAll();
		mockery.disable();
		done();
	});

	it('registered the notification service', () => {
		assert.ok(notificationService);
	});

	it('POST /notification/devices', () => {
		notificationService = app.service('notification/devices');
		const postBody = {
			service: 'firebase',
			type: 'mobile',
			name: 'test2',
			token: '0000d213816abba584714c0a',
			device_token: 'anderestoken',
			OS: 'android7',
		};

		return notificationService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } }).then((result) => {
			expect(result.data.id).to.equal('59199dbe8d4be221143cc866');
			expect(result.data.type).to.equal('messages');
		});
	});

	it('DELETE /notification/devices/{id}', () => {
		notificationService = app.service('notification/devices/');
		return notificationService
			.remove('anderestoken', { payload: { userId: '0000d213816abba584714c0a' } })
			.then((result) => {
				expect(result.data.id).to.equal('59199dbe8d4be221143cc866');
				expect(result.data.type).to.equal('messages');
			});
	});

	it('FIND /notification/devices', () => {
		notificationService = app.service('notification/devices/');
		return notificationService.find({ query: {}, payload: { userId: '0000d213816abba584714c0a' } }).then((result) => {
			expect(result.data.id).to.equal('59199dbe8d4be221143cc866');
			expect(result.data.type).to.equal('messages');
		});
	});

	it('POST /notification/callback', () => {
		notificationService = app.service('notification/callback/');
		const postBody = {
			notificationId: '59145ecf9fb4c347bdc793b3',
			type: 'received',
		};

		return notificationService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } }).then((result) => {
			expect(result.data.id).to.equal('59199dbe8d4be221143cc866');
			expect(result.data.type).to.equal('messages');
		});
	});

	it('GET /notification', () => {
		notificationService = app.service('notification');
		return notificationService.find({ query: {}, payload: { userId: '0000d213816abba584714c0a' } }).then((result) => {
			expect(result.data.id).to.equal('59199dbe8d4be221143cc866');
			expect(result.data.type).to.equal('messages');
		});
	});

	it('GET /notification/{id}', () => {
		notificationService = app.service('notification');
		return notificationService
			.get('59145b580908aa4173328cb7', { payload: { userId: '0000d213816abba584714c0a' } })
			.then((result) => {
				expect(result.data.id).to.equal('59199dbe8d4be221143cc866');
				expect(result.data.type).to.equal('messages');
			});
	});

	it('POST /notification/messages', () => {
		notificationService = app.service('notification/messages/');
		const postBody = {
			title: 'New Notification from Teacher1_1',
			body: 'You have a new Notification',
			token: '0000d213816abba584714c0a',
			scopeIds: ['0000d213816abba584714c0a'],
		};

		return notificationService.create(postBody, { payload: { userId: '0000d213816abba584714c0a' } }).then((result) => {
			expect(result.data.id).to.equal('59199dbe8d4be221143cc866');
			expect(result.data.type).to.equal('messages');
		});
	});

	it('GET /notification/messages/{id}', () => {
		notificationService = app.service('notification/messages/');
		return notificationService
			.get('59199dbe8d4be221143cc866', { payload: { userId: '0000d213816abba584714c0a' } })
			.then((result) => {
				expect(result.data.id).to.equal('59199dbe8d4be221143cc866');
				expect(result.data.type).to.equal('messages');
			});
	});
});
