import { ObjectId } from '@mikro-orm/mongodb';
import { roomInvitationLinkTestFactory } from '../../testing/room-invitation-link.test.factory';
import { RoomInvitationLinkFactory } from './room-invitation-link.factory';
import { randomBytes } from 'node:crypto';
import type * as Crypto from 'node:crypto';

jest.mock('node:crypto', () => {
	return {
		...jest.requireActual<typeof Crypto>('node:crypto'),
		randomBytes: jest.fn(),
	};
});

describe('RoomInvitationLinkFactory', () => {
	beforeEach(() => {
		jest.mocked(randomBytes).mockImplementation(jest.requireActual<typeof Crypto>('node:crypto').randomBytes);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createInvitationLink', () => {
		describe('when creating an invitation', () => {
			const setup = () => {
				const bytes = Buffer.alloc(32, 255);
				const link = roomInvitationLinkTestFactory.build();
				jest.mocked(randomBytes).mockImplementationOnce(() => bytes);

				return { bytes, props: link.getProps() };
			};

			it('should generate an independent 256-bit URL-safe credential and a valid internal id', () => {
				const { bytes, props } = setup();

				const link = RoomInvitationLinkFactory.createInvitationLink(props);

				expect(ObjectId.isValid(link.id)).toBe(true);
				expect(link.id).not.toBe(props.id);
				expect(randomBytes).toHaveBeenLastCalledWith(32);
				expect(link.invitationToken).toBe(bytes.toString('base64url'));
				expect(link.invitationToken).toHaveLength(43);
				expect(link.invitationToken).toMatch(/^[A-Za-z0-9_-]+$/);
			});
		});
	});

	describe('buildFromProps', () => {
		describe('when reconstructing persisted invitations', () => {
			const setup = () => {
				const link = roomInvitationLinkTestFactory.build();
				const legacyLink = roomInvitationLinkTestFactory.build({ invitationToken: undefined });
				jest.mocked(randomBytes).mockClear();

				return { link, legacyLink };
			};

			it('should preserve stored tokens without generating credentials for legacy links', () => {
				const { link, legacyLink } = setup();

				const rebuilt = RoomInvitationLinkFactory.buildFromProps(link.getProps());
				const rebuiltLegacy = RoomInvitationLinkFactory.buildFromProps(legacyLink.getProps());

				expect(rebuilt.invitationToken).toBe(link.invitationToken);
				expect(rebuiltLegacy.invitationToken).toBeUndefined();
				expect(randomBytes).not.toHaveBeenCalled();
			});
		});
	});
});
