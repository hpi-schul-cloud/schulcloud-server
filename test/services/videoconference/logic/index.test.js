const { expect } = require('chai');
const mongoose = require('mongoose');
const url = require('url');
const { ROLES, RESPONSE_STATUS, MESSAGE_KEYS } = require('../../../../src/services/videoconference/logic/constants');
const { createMeeting, getMeetingInfo } = require('../../../../src/services/videoconference/logic');
const testServer = require('../../../../src/services/videoconference/logic/server');


describe.only('test videoconference logic', () => {
	it('test server initialized', () => {
		expect(testServer).to.be.ok;
	});

	it('constants have not been modified', () => {
		expect(Object.values(ROLES))
			.to.be.deep.equal([
				'moderator',
				'attendee',
			]);
		expect(Object.values(RESPONSE_STATUS))
			.to.be.deep.equal([
				'SUCCESS',
				'ERROR',
			]);
		expect(Object.values(MESSAGE_KEYS))
			.to.be.deep.equal([
				'notFound',
			]);
	});

	it('create a new or existing meeting works', async () => {
		const randomId = String(new mongoose.Types.ObjectId());

		// create a new meeting
		const moderatorUrl = await createMeeting(
			testServer,
			'testMeeting',
			randomId,
			'Test Moderator',
			ROLES.MODERATOR,
		);
		expect(moderatorUrl).to.be.not.empty;
		expect(url.parse(moderatorUrl)).to.be.ok;

		// re-create an existing meeting
		const attendeeUrl = await createMeeting(
			testServer,
			'testMeeting',
			randomId,
			'Test Attendee',
			ROLES.ATTENDEE,
		);
		expect(attendeeUrl).to.be.not.empty;
		expect(url.parse(attendeeUrl)).to.be.ok;
	});

	it('get meeting information for not existing meeting', async () => {
		const randomId = String(new mongoose.Types.ObjectId());
		const response = await getMeetingInfo(testServer, randomId);
		expect(response).to.have.property('messageKey');
		expect(response.messageKey[0]).to.equal(MESSAGE_KEYS.NOT_FOUND);
	});

	it('get meeting information for existing meeting', async () => {
		const randomId = String(new mongoose.Types.ObjectId());
		// create a new meeting
		const moderatorUrl = await createMeeting(
			testServer,
			'testExistingMeeting',
			randomId,
			'Test Moderator',
			ROLES.MODERATOR,
		);
		expect(moderatorUrl).to.be.not.empty;
		expect(url.parse(moderatorUrl)).to.be.ok;
		const response = await getMeetingInfo(testServer, randomId);
		expect(response).to.have.property('returncode');
		expect(response.returncode[0]).to.equal(RESPONSE_STATUS.SUCCESS);
		expect(response.meetingID[0]).to.equal(randomId);
	});
});
