const { expect } = require('chai');
const sinon = require('sinon');

const appPromise = require('../../../src/app');
const { SMTP_SENDER } = require('../../../config/globals');

describe('Mail Service', async () => {
	const app = await appPromise;
	const mailService = app.service('/mails');
	let nestMailService;

	beforeEach(() => {
		nestMailService = { send: sinon.spy() };
		app.services['nest-mail'] = nestMailService;
	});

	describe('valid emails', () => {
		it('should send an valid text email to the notification service', async () => {
			const params = {
				email: 'test@test.test',
				subject: 'test',
				content: { text: 'Testing Purposes' },
			};
			await mailService.create(params);
			// assert that notification service was actually called
			expect(nestMailService.send.calledOnce).to.equal(true);
			const payload = nestMailService.send.firstCall.args[0];
			expect(payload.recipients).to.equal([params.email]);
			expect(payload.mail.plainTextContent).to.equal(params.content.text);
		});
		it('should send an valid html email to the notification service', async () => {
			const params = {
				email: 'test@test.test',
				subject: 'test',
				content: { html: '<h1>Testing Purposes</h1>' },
			};
			await mailService.create(params);
			// assert that notification service was actually called
			expect(nestMailService.send.calledOnce).to.equal(true);
			const payload = nestMailService.send.firstCall.args[0];
			expect(payload.recipients).to.equal([params.email]);
			expect(payload.mail.htmlContent).to.equal(params.content.html);
		});
		it('files should be base64 encoded', async () => {
			const base64Content = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
			const params = {
				email: 'test@test.test',
				subject: 'test',
				content: { html: '<h1>Testing Purposes</h1>' },
				attachments: [
					{
						filename: 'test.gif',
						content: Buffer.from(base64Content, 'base64'),
					},
				],
			};
			await mailService.create(params);
			// assert that notification service was actually called
			expect(nestMailService.send.calledOnce).to.equal(true);
			const payload = nestMailService.send.firstCall.args[0];
			expect(payload.recipients).to.equal([params.email]);
			expect(payload.mail.htmlContent).to.equal(params.content.html);
			expect(payload.mail.attachments[0].name).to.equal(params.attachments[0].filename);
			expect(payload.mail.attachments[0].base64Content).to.equal(base64Content);
			expect(payload.mail.attachments[0].contentDisposition).to.equal('ATTACHMENT');
		});

		it('From address should not be changed by the caller', async () => {
			await mailService.create({
				from: 'customFromAddress@test.com',
				email: 'test@test.test',
				subject: 'test',
				content: { html: '<h1>Testing Purposes</h1>' },
			});

			// assert that notification service was actually called
			expect(nestMailService.send.calledOnce).to.equal(true);
			const payload = nestMailService.send.firstCall.args[0];
			expect(payload.from).to.equal(SMTP_SENDER);
		});
	});

	describe('invalid emails', async () => {
		beforeEach(() => {
			nestMailService = {
				send: () => {
					throw new Error('Invalid data provided');
				},
			};
			app.services['nest-mail'] = nestMailService;
		});

		it('should throw if notification server returns error', async () => {
			try {
				await mailService.create({
					content: { text: 'Testing Purposes' },
				});
				throw new Error('The previous call should have failed.');
			} catch (error) {
				expect(error.message).to.equal('Invalid data provided');
			}
		});
	});
});
