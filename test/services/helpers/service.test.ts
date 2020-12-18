import { expect } from 'chai';
import nock from 'nock';
import { NODE_ENV, SMTP_SENDER } from '../../../config/globals';
import appPromise from '../../../src/app';

let config;

const isMailbodyValid = ({ platform, platformId, to, subject, text, html, attachments }) => {
	// file content must be base64 encoded ant therefore of type string
	const attachmentsAreValid = attachments.every((attachment) =>
		Boolean(typeof attachment.filename === 'string' && typeof attachment.content === 'string')
	);
	const hasRequiredAttributes = Boolean(platform && platformId && to && subject && (text || html));
	return Boolean(hasRequiredAttributes && attachmentsAreValid);
};

const getNotificationMock = (expectedData = {}) =>
	new Promise((resolve) => {
		nock(config.NOTIFICATION_URI)
			.post('/mails')
			.reply(200, (uri, requestBody) => {
				Object.entries(expectedData).forEach(([key, value]) => {
					expect(requestBody[key]).to.eql(value);
				});
				expect(isMailbodyValid(requestBody)).to.equal(true);
				resolve(true);
				return 'Message queued';
			});
	});

describe('Mail Service', async () => {
	config = await import(`../../../config/${NODE_ENV}.json`);
	const app = await appPromise;
	const mailService = app.service('/mails');

	afterEach(() => {
		nock.cleanAll();
	});

	describe('valid emails', () => {
		it('should send an valid text email to the notification service', async () => {
			const cb = getNotificationMock();
			await mailService.create({
				email: 'test@test.test',
				subject: 'test',
				content: { text: 'Testing Purposes' },
			});
			// assert that notification service was actually called
			expect(await cb).to.equal(true);
		});
		it('should send an valid html email to the notification service', async () => {
			const cb = getNotificationMock();
			await mailService.create({
				email: 'test@test.test',
				subject: 'test',
				content: { html: '<h1>Testing Purposes</h1>' },
			});
			// assert that notification service was actually called
			expect(await cb).to.equal(true);
		});
		it('files should be base64 encoded', async () => {
			const cb = getNotificationMock({
				attachments: [
					{
						filename: 'test.gif',
						content: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
					},
				],
			});
			await mailService.create({
				email: 'test@test.test',
				subject: 'test',
				content: { html: '<h1>Testing Purposes</h1>' },
				attachments: [
					{
						filename: 'test.gif',
						content: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
					},
				],
			});
			// assert that notification service was actually called
			expect(await cb).to.equal(true);
		});

		it('From address should not be changed by the caller', async () => {
			const notifcationMock = getNotificationMock({
				from: SMTP_SENDER,
			});

			await mailService.create({
				from: 'customFromAddress@test.com',
				email: 'test@test.test',
				subject: 'test',
				content: { html: '<h1>Testing Purposes</h1>' },
			});

			// assert that notification service was actually called
			expect(await notifcationMock).to.equal(true);
		});
	});

	describe('invalid emails', () => {
		beforeEach(() => {
			nock(config.NOTIFICATION_URI).post('/mails').replyWithError('invalid data send');
		});
		it('should throw if notification server returns error', async () => {
			try {
				await mailService.create({
					content: { text: 'Testing Purposes' },
				});
				throw new Error('The previous call should have failed.');
			} catch (error) {
				expect(error.message).to.equal('Error: invalid data send');
			}
		});
	});
});
