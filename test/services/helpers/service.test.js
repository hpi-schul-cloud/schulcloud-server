const { expect } = require('chai');
const nock = require('nock');

const app = require('../../../src/app');
const MailService = require('../../../src/services/helpers/service');

// eslint-disable-next-line import/no-dynamic-require
const config = require(`../../../config/${process.env.NODE_ENV || 'default'}.json`);

const isMailbodyValid = ({
	platform,
	to,
	subject,
	text,
	html,
	replyTo,
}) => !!(platform && to && subject && (text || html) && replyTo);

describe('Mail Service', () => {
	let mailService;

	before(() => {
		app.use('/mails', new MailService());
		mailService = app.service('/mails');
	});

	describe('valid emails', () => {
		beforeEach(() => {
			nock(config.services.notification)
				.post('/mails')
				.reply(200,
					(uri, requestBody) => {
						expect(isMailbodyValid(requestBody)).to.equal(true);
						return 'Message queued';
					});
		});
		it('should send an valid text email to the notification service', async () => {
			await mailService.create({
				email: 'test@test.test',
				subject: 'test',
				content: { text: 'Testing Purposes' },
			});
		});
		it('should send an valid html email to the notification service', async () => {
			await mailService.create({
				email: 'test@test.test',
				subject: 'test',
				content: { html: '<h1>Testing Purposes</h1>' },
			});
		});
	});
});
