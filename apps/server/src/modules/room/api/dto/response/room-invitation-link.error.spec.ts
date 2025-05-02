import { RoomInvitationLinkError } from './room-invitation-link.error';
import { RoomInvitationLinkValidationError } from '../../type/room-invitation-link-validation-error.enum';

describe('RoomInvitationLinkError', () => {
	it('should create an instance with the provided error', () => {
		const error = RoomInvitationLinkValidationError.EXPIRED;
		const instance = new RoomInvitationLinkError(error);

		expect(instance).toBeInstanceOf(RoomInvitationLinkError);
		expect(instance.error).toBe(error);
	});
});
