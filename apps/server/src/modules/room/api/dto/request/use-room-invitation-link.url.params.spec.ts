import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { roomInvitationLinkTestFactory } from '../../../testing/room-invitation-link.test.factory';
import { RoomInvitationLinkUrlParams } from './room-invitation-link.url.params';
import { UseRoomInvitationLinkUrlParams } from './use-room-invitation-link.url.params';

describe('UseRoomInvitationLinkUrlParams', () => {
	describe('validate', () => {
		describe('when the credential is a token or legacy id', () => {
			const setup = () => {
				const link = roomInvitationLinkTestFactory.build();

				return { link };
			};

			it('should accept the invitation token for redemption', async () => {
				const { link } = setup();
				const params = plainToInstance(UseRoomInvitationLinkUrlParams, {
					roomInvitationLinkId: link.invitationToken,
				});

				const errors = await validate(params);

				expect(errors).toEqual([]);
			});

			it('should accept the legacy id for redemption', async () => {
				const { link } = setup();
				const params = plainToInstance(UseRoomInvitationLinkUrlParams, { roomInvitationLinkId: link.id });

				const errors = await validate(params);

				expect(errors).toEqual([]);
			});

			it('should reject the invitation token for management', async () => {
				const { link } = setup();
				const params = plainToInstance(RoomInvitationLinkUrlParams, {
					roomInvitationLinkId: link.invitationToken,
				});

				const errors = await validate(params);

				expect(errors).toHaveLength(1);
			});
		});

		describe('when the credential is malformed', () => {
			const setup = (credential: unknown) => {
				const params = plainToInstance(UseRoomInvitationLinkUrlParams, { roomInvitationLinkId: credential });

				return { params };
			};

			it.each([
				undefined,
				null,
				42,
				'',
				'a'.repeat(20),
				'a'.repeat(22),
				'a'.repeat(23),
				'g'.repeat(24),
				'a'.repeat(43),
				`${'a'.repeat(20)}+`,
				`${'a'.repeat(20)}/`,
				`${'a'.repeat(20)}=`,
				`${'a'.repeat(21)}\n`,
				`${'a'.repeat(24)}\n`,
			])('should reject %p', async (credential) => {
				const { params } = setup(credential);

				const errors = await validate(params);

				expect(errors).toHaveLength(1);
			});
		});
	});
});
