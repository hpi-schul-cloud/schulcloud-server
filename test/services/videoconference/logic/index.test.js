const { expect } = require('chai');
const url = require('url');
const { ROLES, RETURN_CODES, MESSAGE_KEYS } = require('../../../../src/services/videoconference/logic/constants');
const { joinMeeting } = require('../../../../src/services/videoconference/logic');
const testServer = require('../../../../src/services/videoconference/logic/server');

describe('test videoconference logic', () => {
	it('test server initialized', () => {
		expect(testServer).to.be.ok;
	});

	it('constants have not been modified', () => {
		expect(Object.values(ROLES))
			.to.be.deep.equal([
				'moderator',
				'attendee',
			]);
		expect(Object.values(RETURN_CODES))
			.to.be.deep.equal([
				'SUCCESS',
				'FAILED',
			]);
		expect(Object.values(MESSAGE_KEYS))
			.to.be.deep.equal([
				'notFound',
			]);
	});

	it('join a new or existing meeting', async () => {
		// join a new meeting
		const moderatorUrl = await joinMeeting(
			testServer,
			'testMeeting',
			'meetingTestId',
			'Test Moderator',
			ROLES.MODERATOR,
		);
		expect(moderatorUrl).to.be.not.empty;
		expect(url.parse(moderatorUrl)).to.be.ok;

		// join an existing meeting
		const attendeeUrl = await joinMeeting(
			testServer,
			'testMeeting',
			'meetingTestId',
			'Test Attendee',
			ROLES.ATTENDEE,
		);
		expect(attendeeUrl).to.be.not.empty;
		expect(url.parse(attendeeUrl)).to.be.ok;
	});

	it('get meeting information for not existing meeting', () => {

	});
});
