/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const mongoose = require('mongoose');
const url = require('url');
const { ROLES, RESPONSE_STATUS, MESSAGE_KEYS } = require('../../../../src/services/videoconference/logic/constants');
const { joinMeeting, getMeetingInfo, sanitize } = require('../../../../src/services/videoconference/logic');
const testServer = require('../../../../src/services/videoconference/logic/server');
const utils = require('../../../../src/services/videoconference/logic/utils');

const ALLOWED_CHARS = '0-9A-Za-zÀ-ÖØ-öø-ÿ.-=_`´ ';

describe('videoconference logic', () => {
	describe('setup check', () => {
		it('test server initialized', () => {
			expect(testServer).to.be.ok;
		});

		it('constants have not been modified', () => {
			expect(Object.values(ROLES)).to.be.deep.equal(['moderator', 'attendee']);
			expect(Object.values(RESPONSE_STATUS)).to.be.deep.equal(['SUCCESS', 'ERROR']);
			expect(Object.values(MESSAGE_KEYS)).to.be.deep.equal(['notFound']);
		});
	});

	it('get meeting information for not existing meeting', async () => {
		const otherRandomId = String(new mongoose.Types.ObjectId());
		const response = await getMeetingInfo(testServer, otherRandomId);
		expect(utils.isValidNotFoundResponse(response)).to.be.true;
		expect(response.messageKey[0]).to.equal(MESSAGE_KEYS.NOT_FOUND);
	});

	describe('create meeting', function integration() {
		this.timeout = 5000;

		let randomId;

		before('create a first meeting', async () => {
			// create a new meeting
			randomId = String(new mongoose.Types.ObjectId());
			// 	server, meetingName, meetingId, userName, role, params, create,
			const moderatorUrl = await joinMeeting(
				testServer,
				'testMeeting',
				randomId,
				'Test Moderator',
				ROLES.MODERATOR,
				{},
				true
			);
			expect(moderatorUrl).to.be.not.empty;
			expect(url.parse(moderatorUrl)).to.be.ok;
		});

		it('get meeting information for existing meeting', async () => {
			// create a new meeting
			const response = await getMeetingInfo(testServer, randomId);
			expect(response).to.have.property('returncode');
			expect(response.returncode[0]).to.equal(RESPONSE_STATUS.SUCCESS);
			expect(response.meetingID[0]).to.equal(randomId);
		});

		it('re-create existing meeting works', async () => {
			// re-create an existing meeting
			const attendeeUrl = await joinMeeting(
				testServer,
				'testMeeting',
				randomId,
				'Test Attendee',
				ROLES.ATTENDEE,
				{},
				true
			);
			expect(attendeeUrl).to.be.not.empty;
			expect(url.parse(attendeeUrl)).to.be.ok;
		});

		it('create meeting works with non-working special chars replaced is working', async () => {
			// create a new meeting
			randomId = String(new mongoose.Types.ObjectId());
			// 	server, meetingName, meetingId, userName, role, params, create,
			const moderatorUrl = await joinMeeting(
				testServer,
				sanitize(`${ALLOWED_CHARS}'@?=)(/&%$§#\\🤘`),
				randomId,
				sanitize(`${ALLOWED_CHARS}'@?=)(/&%$§#\\🤘`),
				ROLES.MODERATOR,
				{},
				true
			);
			expect(moderatorUrl).to.be.not.empty;
			expect(url.parse(moderatorUrl)).to.be.ok;
		});

		it('create meeting fails with chars not replaced', async () => {
			// create a new meeting
			randomId = String(new mongoose.Types.ObjectId());
			// 	server, meetingName, meetingId, userName, role, params, create,

			expect(
				joinMeeting(testServer, ALLOWED_CHARS, randomId, ALLOWED_CHARS, ROLES.MODERATOR, {}, true)
			).to.be.not.rejectedWith(Error);

			expect(
				joinMeeting(testServer, `${ALLOWED_CHARS}'`, randomId, ALLOWED_CHARS, ROLES.MODERATOR, {}, true)
			).to.be.rejectedWith(Error);
		});
	});

	describe('when a malformed username or room name is given', () => {
		it('should sanitize non numerical characters in room names', () => {
			expect(sanitize(ALLOWED_CHARS), 'should not replace all chars allowed').to.equal(ALLOWED_CHARS);
			expect(sanitize("'"), 'simple apostrophe fails bbb checksum and should be removed').to.equal('');
			expect(sanitize('Mathe Pêtér')).to.equal('Mathe Pêtér');
			expect(sanitize('jid328iu d3LD83f uidw!"§$%&/()=?{}[^]]|<>')).to.equal('jid328iu d3LD83f uidw=');
			expect(sanitize('Max Mustermann')).to.equal('Max Mustermann');
			expect(sanitize('Some "Quoted" (Text)')).to.equal('Some Quoted Text');
			expect(sanitize('René')).to.equal('René');
			expect(sanitize('øÜÖÄüöäáÁÀàûÛ')).to.equal('øÜÖÄüöäáÁÀàûÛ');
		});
	});
});
