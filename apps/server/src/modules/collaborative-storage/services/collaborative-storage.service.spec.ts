import { Test, TestingModule } from '@nestjs/testing';
import { CollaborativeStorageService } from '@src/modules/collaborative-storage/services/collaborative-storage.service';
import { RoleRepo, TeamsRepo } from '@shared/repo';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { EntityId, Role, RoleName, Team } from '@shared/domain';
import { roleFactory, setupEntities } from '@shared/testing';
import { CollaborativeStorageAdapter } from '@shared/infra/collaborative-storage';
import { TeamMapper } from '@src/modules/collaborative-storage/mapper/team.mapper';
import { RoleMapper } from '@src/modules/collaborative-storage/mapper/role.mapper';
import { ForbiddenException } from '@nestjs/common';
import { AuthorizationService } from '@src/modules/authorization';
import { MikroORM } from '@mikro-orm/core';

describe('Collaborative Storage Service', () => {
	let module: TestingModule;
	let service: CollaborativeStorageService;
	let adapter: DeepMocked<CollaborativeStorageAdapter>;
	let authService: DeepMocked<AuthorizationService>;
	let mockId: string;
	let orm: MikroORM;

	beforeAll(async () => {
		[module] = await Promise.all([
			Test.createTestingModule({
				providers: [
					CollaborativeStorageService,
					TeamMapper,
					RoleMapper,
					{
						provide: RoleRepo,
						useValue: {
							findById: jest.fn().mockImplementation((roleId: EntityId): Promise<Role> => {
								return Promise.resolve(roleFactory.buildWithId({}, roleId));
							}),
						},
					},
					{
						provide: TeamsRepo,
						useValue: {
							findById: jest.fn().mockImplementation((teamId: EntityId): Promise<Team> => {
								return Promise.resolve(teamFactory.buildWithId({}, teamId));
							}),
						},
					},
					{
						provide: CollaborativeStorageAdapter,
						useValue: createMock<CollaborativeStorageAdapter>(),
					},
					{
						provide: AuthorizationService,
						useValue: createMock<AuthorizationService>(),
					},
				],
			}).compile(),
		]);
		service = module.get(CollaborativeStorageService);
		adapter = module.get(CollaborativeStorageAdapter);
		authService = module.get(AuthorizationService);
		mockId = '0123456789abcdef01234567';
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('Find Team By Id', () => {
		it('should find a team with a provided id', async () => {
			const ret = await service.findTeamById(mockId);
			expect(ret.id).toEqual(mockId);
		});
	});

	describe('Find Role By Id', () => {
		it('should find a role with a provided id', async () => {
			const ret = await service.findRoleById(mockId);
			expect(ret.id).toEqual(mockId);
		});
	});

	describe('Update TeamPermissions For Role', () => {
		it('should call the adapter', async () => {
			authService.checkPermission.mockImplementation(() => {
				// do nothing
			});
			jest.spyOn(service, 'findRoleById').mockResolvedValue({ id: 'testRoleId', name: RoleName.TEAMMEMBER });
			jest.spyOn(service, 'findTeamById').mockResolvedValue({
				name: 'testTeam',
				userIds: [{ userId: 'testUser', schoolId: 'testSchool', role: 'testRoleId' }],
			});
			jest.spyOn(adapter, 'updateTeamPermissionsForRole').mockImplementation(() => {
				// do nothing
			});
			await service.updateTeamPermissionsForRole(mockId, mockId, mockId, {
				read: false,
				write: false,
				create: false,
				delete: false,
				share: false,
			});
			expect(adapter.updateTeamPermissionsForRole).toHaveBeenCalled();
		});

		it('should throw a forbidden exception', async () => {
			authService.checkPermission.mockImplementation(() => {
				throw new ForbiddenException();
			});
			await expect(
				service.updateTeamPermissionsForRole(mockId, mockId, mockId, {
					read: false,
					write: false,
					create: false,
					delete: false,
					share: false,
				})
			).rejects.toThrow(ForbiddenException);
		});
	});
});
