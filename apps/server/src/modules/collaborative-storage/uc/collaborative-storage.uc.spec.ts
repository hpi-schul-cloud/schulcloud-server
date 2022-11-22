import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamPermissionsBody } from '@src/modules/collaborative-storage/controller/dto/team-permissions.body.params';
import { TeamRoleDto } from '@src/modules/collaborative-storage/controller/dto/team-role.params';
import { TeamPermissionsMapper } from '@src/modules/collaborative-storage/mapper/team-permissions.mapper';
import { CollaborativeStorageService } from '@src/modules/collaborative-storage/services/collaborative-storage.service';
import { TeamDto } from '@src/modules/collaborative-storage/services/dto/team.dto';
import { CollaborativeStorageUc } from '@src/modules/collaborative-storage/uc/collaborative-storage.uc';

describe('TeamStorageUc', () => {
	let module: TestingModule;
	let uc: CollaborativeStorageUc;
	let service: CollaborativeStorageService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CollaborativeStorageUc,
				{
					provide: CollaborativeStorageService,
					useValue: createMock<CollaborativeStorageService>(),
				},
				{
					provide: TeamPermissionsMapper,
					useValue: createMock<TeamPermissionsMapper>(),
				},
			],
		}).compile();
		uc = module.get(CollaborativeStorageUc);
		service = module.get(CollaborativeStorageService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('Update TeamRole Permissions', () => {
		let teamrole: TeamRoleDto;
		let permissions: TeamPermissionsBody;

		beforeAll(() => {
			teamrole = { teamId: 'mockTeam', roleId: 'MockRole' };
			permissions = {
				read: false,
				write: false,
				create: false,
				delete: false,
				share: false,
			};
		});

		it('should call the service', async () => {
			await uc.updateUserPermissionsForRole('mockUser', teamrole, permissions);
			expect(service.updateTeamPermissionsForRole).toHaveBeenCalled();
		});
	});

	describe('Delete team in nextcloud', () => {
		it('should call the service', async () => {
			const teamIdMock = 'teamIdMock';
			await uc.deleteTeam(teamIdMock);
			expect(service.deleteTeam).toHaveBeenCalledWith(teamIdMock);
		});
	});

	describe('Create team in nextcloud', () => {
		it('should call the service', async () => {
			const teamDto: TeamDto = { id: 'id', name: 'name', teamUsers: [] };
			await uc.createTeam(teamDto);
			expect(service.createTeam).toHaveBeenCalledWith(teamDto);
		});
	});

	describe('Update team in nextcloud', () => {
		it('should call the service', async () => {
			const teamDto: TeamDto = { id: 'id', name: 'name', teamUsers: [] };
			await uc.updateTeam(teamDto);
			expect(service.updateTeam).toHaveBeenCalledWith(teamDto);
		});
	});
});
