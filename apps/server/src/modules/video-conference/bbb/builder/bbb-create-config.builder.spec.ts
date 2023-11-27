import { Configuration } from '@hpi-schul-cloud/commons';
import { BBBCreateConfigBuilder } from './bbb-create-config.builder';
import { BBBCreateConfig, GuestPolicy } from '../request/bbb-create.config';

describe('BBBCreateConfigBuilder', () => {
	const SC_DOMAIN = 'server origin name';

	beforeAll(() => {
		jest.spyOn(Configuration, 'get').mockReturnValue(SC_DOMAIN);
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should build generic bbb createConfig with all attributes', () => {
		// Arrange
		const name = 'name';
		const meetingID = 'meetingId';
		const logoutURL = 'logoutUrl';
		const welcome = 'welcome';
		const guestPolicy = GuestPolicy.ALWAYS_ACCEPT;
		const muteOnStart = true;

		const builder = new BBBCreateConfigBuilder(new BBBCreateConfig({ name, meetingID }));

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
		expect(result['meta_bbb-origin-server-name']).toEqual(SC_DOMAIN);
	});

	it('should build generic bbb createConfig with only required attributes', () => {
		// Arrange
		const name = 'name';
		const meetingID = 'meetingId';
		const builder = new BBBCreateConfigBuilder(new BBBCreateConfig({ name, meetingID }));

		// Act
		const result: BBBCreateConfig = builder.build();

		// Assert
		expect(result.name).toEqual(name);
		expect(result.meetingID).toEqual(meetingID);
		expect(result.logoutURL).toBeUndefined();
		expect(result.welcome).toBeUndefined();
		expect(result.guestPolicy).toBeUndefined();
		expect(result.muteOnStart).toBeUndefined();
		expect(result['meta_bbb-origin-server-name']).toEqual(SC_DOMAIN);
	});
});
