

const { expect } = require('chai');
const mockery = require('mockery');
const winston = require('winston');
const nodemailerMock = require('nodemailer-mock');

describe('Mail Service', () => {
	const emailOptions = {
		email: 'test@test.test',
		subject: 'test',
		content: { html: '<h1>Testing Purposes</h1>', text: 'Testing Purposes' },
	};

	let mailService;

	before((done) => {
		// Enable mockery to mock objects
		mockery.enable({
			warnOnUnregistered: false,
		});

		// Once mocked, any code that calls require('nodemailer') will get our nodemailerMock
		mockery.registerMock('nodemailer', nodemailerMock);

		// Make sure anything that uses nodemailer is loaded here, after it is mocked...
		delete require.cache[require.resolve('../../../src/services/helpers/service')];

		// load new app to make mockery work
		const feathers = require('feathers');
		const app = feathers();
		let secrets;
		try {
			secrets = require('../config/secrets.json');
		} catch (error) {
			secrets = {};
		}
		app.set('secrets', secrets);
		const MailService = require('../../../src/services/helpers/service')(app);
		app.use('/mails', new MailService());
		mailService = app.service('/mails');

		done();
	});

	after(() => {
		// Remove our mocked nodemailer and disable mockery
		mockery.deregisterAll();
		mockery.disable();
	});

	it('should send an email using nodemailer-mock', () => {
		mailService.create(emailOptions)
			.then((_) => {
				// get the array of emails we sent
				const sentMail = nodemailerMock.mock.sentMail();
				expect(sentMail.length).to.equal(1);
				expect(sentMail[0].to).to.equal(emailOptions.email);
				expect(sentMail[0].subject).to.equal(emailOptions.subject);
				expect(sentMail[0].html).to.equal(emailOptions.content.html);
				expect(sentMail[0].text).to.equal(emailOptions.content.text);
			});
	});

	it('should fail to send an email using nodemailer-mock', () => {
		// tell the mock class to return an error
		const err = 'My custom error';
		nodemailerMock.mock.shouldFailOnce();
		nodemailerMock.mock.failResponse(err);

		// call a service that uses nodemailer
		return mailService.create(emailOptions)
			.catch((err) => {
				expect(err).to.be.equal(err);
			});
	});
});
