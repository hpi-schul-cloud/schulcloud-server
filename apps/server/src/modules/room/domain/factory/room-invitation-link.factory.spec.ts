import { ObjectId } from '@mikro-orm/mongodb';
import { roomInvitationLinkTestFactory } from '../../testing/room-invitation-link.test.factory';
import { RoomInvitationLinkFactory } from './room-invitation-link.factory';
import { nanoid } from 'nanoid';
import type * as Nanoid from 'nanoid';

jest.mock('nanoid', () => {
	return {
		...jest.requireActual<typeof Nanoid>('nanoid'),
		nanoid: jest.fn(),
	};
});

describe('RoomInvitationLinkFactory', () => {
	beforeEach(() => {
		jest.mocked(nanoid).mockImplementation(jest.requireActual<typeof Nanoid>('nanoid').nanoid);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createInvitationLink', () => {
		describe('when creating an invitation', () => {
			const setup = () => {
				const token = 'A_0-'.repeat(5) + 'z';
				const link = roomInvitationLinkTestFactory.build();
				jest.mocked(nanoid).mockReturnValueOnce(token);

				return { token, props: link.getProps() };
			};

			it('should generate an independent 21-character NanoID credential and a valid internal id', () => {
				const { token, props } = setup();

				const link = RoomInvitationLinkFactory.createInvitationLink(props);

				expect(ObjectId.isValid(link.id)).toBe(true);
				expect(link.id).not.toBe(props.id);
				expect(nanoid).toHaveBeenLastCalledWith(21);
				expect(link.invitationToken).toBe(token);
				expect(link.invitationToken).toHaveLength(21);
				expect(link.invitationToken).toMatch(/^[A-Za-z0-9_-]+$/);
			});
		});
	});

	describe('buildFromProps', () => {
		describe('when reconstructing persisted invitations', () => {
			const setup = () => {
				const link = roomInvitationLinkTestFactory.build();
				const legacyLink = roomInvitationLinkTestFactory.build({ invitationToken: undefined });
				jest.mocked(nanoid).mockClear();

				return { link, legacyLink };
			};

			it('should preserve stored tokens without generating credentials for legacy links', () => {
				const { link, legacyLink } = setup();

				const rebuilt = RoomInvitationLinkFactory.buildFromProps(link.getProps());
				const rebuiltLegacy = RoomInvitationLinkFactory.buildFromProps(legacyLink.getProps());

				expect(rebuilt.invitationToken).toBe(link.invitationToken);
				expect(rebuiltLegacy.invitationToken).toBeUndefined();
				expect(nanoid).not.toHaveBeenCalled();
			});
		});
	});
});
