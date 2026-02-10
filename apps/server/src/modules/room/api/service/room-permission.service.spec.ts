import { Action, AuthorizationService } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { roleDtoFactory } from '@modules/role/testing';
import { RoomAuthorizable, RoomMembershipService } from '@modules/room-membership';
import type { User } from '@modules/user/repo';
import { Permission } from '@shared/domain/interface';
import type { Room } from '../../domain/do';
import { RoomService } from '../../domain/service/room.service';
import { RoomPublicApiConfig } from '../../room.config';
import { LockedRoomLoggableException } from '../loggables/locked-room-loggable-exception';
import { RoomPermissionService } from './room-permission.service';

type SetupOptions = {
	hasOwner?: boolean;
	user?: Partial<User>;
	hasPermission?: boolean;
	requiredPermissions?: Permission[];
	action?: Action;
	configValue?: boolean;
	roomServiceRoom?: Partial<Room>;
};

describe('RoomPermissionService', () => {
	const buildRoomAuthorizable = (hasOwner: boolean): RoomAuthorizable => {
		const ownerRole = roleDtoFactory.build({ name: RoleName.ROOMOWNER });
		const studentRole = roleDtoFactory.build({ name: RoleName.STUDENT });

		const members = [
			{
				userId: 'owner-user',
				userSchoolId: 'school-1',
				roles: hasOwner ? [ownerRole] : [studentRole],
			},
			{
				userId: 'member-user',
				userSchoolId: 'school-2',
				roles: [studentRole],
			},
		];

		return new RoomAuthorizable('room-123', members, 'school-123');
	};

	const setup = (opts: SetupOptions = {}) => {
		const {
			hasOwner = true,
			user: userPartial,
			hasPermission,
			requiredPermissions = [Permission.ROOM_EDIT_ROOM],
			action = Action.read,
			roomServiceRoom,
		} = opts;

		const config = new RoomPublicApiConfig();
		const roomMembershipService = { getRoomAuthorizable: jest.fn() } as unknown as jest.Mocked<RoomMembershipService>;
		const authorizationService = {
			getUserWithPermissions: jest.fn(),
			checkPermission: jest.fn(),
			hasPermission: jest.fn(),
		} as unknown as jest.Mocked<AuthorizationService>;
		const roomService = { getSingleRoom: jest.fn() } as unknown as jest.Mocked<RoomService>;

		const service = new RoomPermissionService(config, roomMembershipService, authorizationService, roomService);

		const roomAuthorizable = buildRoomAuthorizable(hasOwner);
		roomMembershipService.getRoomAuthorizable.mockResolvedValue(roomAuthorizable);

		const user = { id: 'user-1', ...userPartial } as unknown as User;
		authorizationService.getUserWithPermissions.mockResolvedValue(user);

		if (hasPermission !== undefined) {
			authorizationService.hasPermission.mockReturnValue(hasPermission);
		}

		if (roomServiceRoom) {
			roomService.getSingleRoom.mockResolvedValue(roomServiceRoom as unknown as Room);
		}

		return {
			service,
			config,
			roomMembershipService,
			authorizationService,
			roomService,
			roomAuthorizable,
			user,
			requiredPermissions,
			action,
		};
	};

	it('checkRoomAuthorizationByIds: returns RoomAuthorizable and calls checkPermission with context', async () => {
		const { service, authorizationService, roomAuthorizable, user, requiredPermissions } = setup({
			hasOwner: true,
			requiredPermissions: [Permission.ROOM_EDIT_ROOM],
			action: Action.read,
		});

		const result = await service.checkRoomAuthorizationByIds(user.id, 'room-123', Action.read, requiredPermissions);

		expect(result).toBe(roomAuthorizable);
		expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, roomAuthorizable, {
			action: Action.read,
			requiredPermissions,
		});
	});

	describe('hasRoomPermissions', () => {
		it('hasRoomPermissions: returns true when authorizationService.hasPermission is true', async () => {
			const { service, authorizationService, roomAuthorizable, user, requiredPermissions } = setup({
				hasOwner: true,
				hasPermission: true,
				requiredPermissions: [Permission.ROOM_EDIT_ROOM],
			});

			const result = await service.hasRoomPermissions(user.id, 'room-123', Action.write, requiredPermissions);

			expect(result).toBe(true);
			expect(authorizationService.hasPermission).toHaveBeenCalledWith(user, roomAuthorizable, {
				action: Action.write,
				requiredPermissions,
			});
		});

		it('hasRoomPermissions: returns false when authorizationService.hasPermission is false', async () => {
			const { service, user } = setup({ hasOwner: true, hasPermission: false });

			const result = await service.hasRoomPermissions(user.id, 'room-123', Action.read);

			expect(result).toBe(false);
		});
	});

	describe('checkRoomIsUnlocked', () => {
		it('checkRoomIsUnlocked: does nothing when a room owner is present', async () => {
			const { service, roomService } = setup({ hasOwner: true });

			await expect(service.checkRoomIsUnlocked('room-123')).resolves.toBeUndefined();

			expect(roomService.getSingleRoom).not.toHaveBeenCalled();
		});

		it('checkRoomIsUnlocked: throws LockedRoomLoggableException when no room owner', async () => {
			const { service, roomService } = setup({ hasOwner: false, roomServiceRoom: { id: 'room-123', name: 'My Room' } });

			await expect(service.checkRoomIsUnlocked('room-123')).rejects.toThrow(LockedRoomLoggableException);

			expect(roomService.getSingleRoom).toHaveBeenCalledWith('room-123');
		});
	});

	describe('checkFeatureAdministrateRoomsEnabled', () => {
		it('checkFeatureAdministrateRoomsEnabled: throws when feature flag disabled', () => {
			const { service, config } = setup();
			config.featureAdministrateRoomsEnabled = false;

			expect(() => service.checkFeatureAdministrateRoomsEnabled()).toThrowError();
		});

		it('checkFeatureAdministrateRoomsEnabled: does nothing when enabled', () => {
			const { service, config } = setup();
			config.featureAdministrateRoomsEnabled = true;

			expect(() => service.checkFeatureAdministrateRoomsEnabled()).not.toThrow();
		});
	});

	describe('checkFeatureRoomCopyEnabled', () => {
		it('checkFeatureRoomCopyEnabled: throws when feature flag disabled', () => {
			const { service, config } = setup();
			config.featureRoomCopyEnabled = false;

			expect(() => service.checkFeatureRoomCopyEnabled()).toThrowError();
		});

		it('checkFeatureRoomCopyEnabled: does nothing when enabled', () => {
			const { service, config } = setup();
			config.featureRoomCopyEnabled = true;

			expect(() => service.checkFeatureRoomCopyEnabled()).not.toThrow();
		});
	});
});
