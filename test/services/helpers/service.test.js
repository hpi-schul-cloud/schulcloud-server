const { expect } = require('chai');
const nock = require('nock');

const app = require('../../../src/app');
const MailService = require('../../../src/services/helpers/service');

// eslint-disable-next-line import/no-dynamic-require
const config = require(`../../../config/${process.env.NODE_ENV || 'default'}.json`);

const isMailbodyValid = ({
	platform,
	platformId,
	to,
	subject,
	text,
	html,
	replyTo,
}) => !!(platform && platformId && to && subject && (text || html) && replyTo);

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

	describe('invalid emails', () => {
		beforeEach(() => {
			nock(config.services.notification)
				.post('/mails')
				.reply(200,
					(uri, requestBody) => {
						expect(isMailbodyValid(requestBody)).to.equal(false);
						return 'Message queued';
					});
		});
		it('should sthrow if subject is missing', async () => {
			try {
				await mailService.create({
					email: 'test@test.test',
					content: { text: 'Testing Purposes' },
				});
				expect('Service executed without errors').to.equeal("Shouldn't be reachable");
			} catch (_) {
				expect('to throw error').to.equal('to throw error');
			}
		});
	});
});
