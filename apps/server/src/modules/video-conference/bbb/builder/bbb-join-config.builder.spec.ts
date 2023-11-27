import { BBBJoinConfigBuilder } from './bbb-join-config.builder';
import { BBBJoinConfig, BBBRole } from '../request/bbb-join.config';

describe('BBBJoinConfigBuilder', () => {
	it('should build generic bbb joinConfig with all attributes', () => {
		// Arrange
		const builder = new BBBJoinConfigBuilder(
			new BBBJoinConfig({
				fullName: 'fullname',
				meetingID: 'meetingId',
				role: BBBRole.MODERATOR,
			})
		);

		// Act
		const result: BBBJoinConfig = builder.build();

		builder.withRole(BBBRole.VIEWER);
		builder.withUserId('userId');
		builder.asGuest(true);

		// Assert
		expect(result.fullName).toEqual('fullname');
		expect(result.meetingID).toEqual('meetingId');
		expect(result.role).toEqual(BBBRole.VIEWER);
		expect(result.guest).toEqual(true);
		expect(result.userID).toEqual('userId');
	});
	it('should build generic bbb joinConfig only with required attributes', () => {
		// Arrange
		const builder = new BBBJoinConfigBuilder(
			new BBBJoinConfig({
				fullName: 'fullname',
				meetingID: 'meetingId',
				role: BBBRole.MODERATOR,
			})
		);

		// Act
		const result: BBBJoinConfig = builder.build();

		// Assert
		expect(result.fullName).toEqual('fullname');
		expect(result.meetingID).toEqual('meetingId');
		expect(result.role).toEqual(BBBRole.MODERATOR);
		expect(result.guest).toBeUndefined();
		expect(result.redirect).toBeUndefined();
		expect(result.userID).toBeUndefined();
	});
});
