import { BBBCreateConfigBuilder } from '@src/modules/video-conference/builder/bbb-create-config.builder';
import { BBBCreateConfig, GuestPolicy } from '@src/modules/video-conference/config/bbb-create.config';

describe('BBBCreateConfigBuilder', () => {
	it('should build generic bbb createConfig with all attributes', () => {
		// Arrange
		const name = 'name';
		const meetingID = 'meetingId';
		const logoutURL = 'logoutUrl';
		const welcome = 'welcome';
		const guestPolicy = GuestPolicy.ALWAYS_ACCEPT;
		const muteOnStart = true;

		const builder = new BBBCreateConfigBuilder({ name, meetingID });

		// Act
		builder.withLogoutUrl(logoutURL);
		builder.withWelcome(welcome);
		builder.withGuestPolicy(guestPolicy);
		builder.withMuteOnStart(muteOnStart);

		const result: BBBCreateConfig = builder.build();

		// Assert
		expect(result.name).toEqual(name);
		expect(result.meetingID).toEqual(meetingID);
		expect(result.logoutURL).toEqual(logoutURL);
		expect(result.welcome).toEqual(welcome);
		expect(result.guestPolicy).toEqual(guestPolicy);
		expect(result.muteOnStart).toEqual(muteOnStart);
	});

	it('should build generic bbb createConfig with only required attributes', () => {
		// Arrange
		const name = 'name';
		const meetingID = 'meetingId';

		const builder = new BBBCreateConfigBuilder({ name, meetingID });

		// Act
		const result: BBBCreateConfig = builder.build();

		// Assert
		expect(result.name).toEqual(name);
		expect(result.meetingID).toEqual(meetingID);
		expect(result.logoutURL).toBeUndefined();
		expect(result.welcome).toBeUndefined();
		expect(result.guestPolicy).toBeUndefined();
		expect(result.muteOnStart).toBeUndefined();
	});
});
