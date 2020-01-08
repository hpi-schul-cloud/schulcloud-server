const { expect } = require('chai');
const nock = require('nock');

const app = require('../../../src/app');

// eslint-disable-next-line import/no-dynamic-require
const config = require(`../../../config/${process.env.NODE_ENV || 'default'}.json`);

const isMailbodyValid = ({
	platform,
	platformId,
	to,
	subject,
	text,
	html,
	attachments,
}) => {
	// file content must be base64 encoded ant therefore of type string
	const attachmentsAreValid = attachments
		.every((attachment) => Boolean(typeof attachment.filename === 'string'
			&& typeof attachment.content === 'string'));
	const hasRequiredAttributes = Boolean(platform && platformId && to && subject && (text || html));
	return Boolean(hasRequiredAttributes && attachmentsAreValid);
};

const getNotificationMock = (expectedData = {}) => {
	nock(config.services.notification)
		.post('/mails')
		.reply(200,
			(uri, requestBody) => {
				Object.entries(expectedData).forEach(([key, value]) => {
					expect(requestBody[key]).to.eql(value);
				});
				expect(isMailbodyValid(requestBody)).to.equal(true);
				return 'Message queued';
			});
};

describe.only('Mail Service', () => {
	const mailService = app.service('/mails');

	afterEach(() => {
		nock.cleanAll();
	});

	describe('valid emails', () => {
		it('should send an valid text email to the notification service', async () => {
			getNotificationMock();
			await mailService.create({
				email: 'test@test.test',
				subject: 'test',
				content: { text: 'Testing Purposes' },
			});
		});
		it('should send an valid html email to the notification service', async () => {
			getNotificationMock();
			await mailService.create({
				email: 'test@test.test',
				subject: 'test',
				content: { html: '<h1>Testing Purposes</h1>' },
			});
		});
		it('files should be base64 encoded', async () => {
			getNotificationMock({
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
		});
	});

	describe('invalid emails', () => {
		beforeEach(() => {
			nock(config.services.notification)
				.post('/mails')
				.replyWithError('invalid data send');
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
