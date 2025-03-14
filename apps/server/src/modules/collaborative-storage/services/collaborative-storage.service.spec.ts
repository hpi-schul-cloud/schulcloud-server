import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CollaborativeStorageAdapter } from '@infra/collaborative-storage';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationService } from '@modules/authorization';
import { TeamMapper } from '@modules/collaborative-storage/mapper/team.mapper';
import { CollaborativeStorageService } from '@modules/collaborative-storage/services/collaborative-storage.service';
import { RoleName } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { RoleService } from '@modules/role/service/role.service';
import { TeamEntity, TeamRepo } from '@modules/team/repo';
import { teamFactory } from '@modules/team/testing';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { TeamDto } from './dto/team.dto';

describe('Collaborative Storage Service', () => {
	let module: TestingModule;
	let service: CollaborativeStorageService;

	let adapter: DeepMocked<CollaborativeStorageAdapter>;
	let authService: DeepMocked<AuthorizationService>;
	let roleService: DeepMocked<RoleService>;
	let teamRepo: DeepMocked<TeamRepo>;

	let mockId: string;
	let roleDto: RoleDto;
	let team: TeamEntity;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CollaborativeStorageService,
				TeamMapper,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: TeamRepo,
					useValue: createMock<TeamRepo>(),
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
		}).compile();
		service = module.get(CollaborativeStorageService);
		adapter = module.get(CollaborativeStorageAdapter);
		authService = module.get(AuthorizationService);
		roleService = module.get(RoleService);
		teamRepo = module.get(TeamRepo);
		await setupEntities([TeamEntity]);
	});

	beforeEach(() => {
		roleDto = new RoleDto({
			id: new ObjectId().toHexString(),
			name: RoleName.TEAMMEMBER,
		});
		team = teamFactory.buildWithId();

		roleService.findById.mockResolvedValue(roleDto);
		teamRepo.findById.mockResolvedValue(team);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('Find Team By Id', () => {
		it('should find a team with a provided id', async () => {
			const ret = await service.findTeamById(team.id);
			expect(ret.id).toEqual(team.id);
		});
	});

	describe('Update TeamPermissions For Role', () => {
		it('should call the adapter', async () => {
			mockId = 'mockId';
			jest.spyOn(service, 'findTeamById').mockResolvedValue({
				id: 'testId',
				name: 'testTeam',
				teamUsers: [{ userId: 'testUser', schoolId: 'testSchool', roleId: 'testRoleId' }],
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
			mockId = 'mockId';
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

	describe('Delete team in the nextcloud', () => {
		const teamIdMock = 'teamIdMock';

		it('should call the adapter', async () => {
			await service.deleteTeam(teamIdMock);
			expect(adapter.deleteTeam).toHaveBeenCalledWith(teamIdMock);
		});
	});

	describe('Create team in the nextcloud', () => {
		const teamDto: TeamDto = { id: 'id', name: 'name', teamUsers: [] };

		it('should call the adapter', async () => {
			await service.createTeam(teamDto);
			expect(adapter.createTeam).toHaveBeenCalledWith(teamDto);
		});
	});

	describe('Update team in the nextcloud', () => {
		const teamDto: TeamDto = { id: 'id', name: 'name', teamUsers: [] };

		it('should call the adapter', async () => {
			await service.updateTeam(teamDto);
			expect(adapter.updateTeam).toHaveBeenCalledWith(teamDto);
		});
	});
});
