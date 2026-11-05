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

			it('should accept both redemption formats but only ids for management', async () => {
				const { link } = setup();
				const tokenParams = plainToInstance(UseRoomInvitationLinkUrlParams, {
					roomInvitationLinkId: link.invitationToken,
				});
				const legacyParams = plainToInstance(UseRoomInvitationLinkUrlParams, { roomInvitationLinkId: link.id });
				const managementParams = plainToInstance(RoomInvitationLinkUrlParams, {
					roomInvitationLinkId: link.invitationToken,
				});

				const tokenErrors = await validate(tokenParams);
				const legacyErrors = await validate(legacyParams);
				const managementErrors = await validate(managementParams);

				expect(tokenErrors).toEqual([]);
				expect(legacyErrors).toEqual([]);
				expect(managementErrors).toHaveLength(1);
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
