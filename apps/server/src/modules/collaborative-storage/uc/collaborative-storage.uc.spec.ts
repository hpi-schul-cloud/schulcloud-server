import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { CollaborativeStorageUc } from '@src/modules/collaborative-storage/uc/collaborative-storage.uc';
import { CollaborativeStorageService } from '@src/modules/collaborative-storage/services/collaborative-storage.service';
import { TeamPermissionsMapper } from '@src/modules/collaborative-storage/mapper/team-permissions.mapper';
import { TeamRoleDto } from '@src/modules/collaborative-storage/controller/dto/team-role.params';
import { TeamPermissionsBody } from '@src/modules/collaborative-storage/controller/dto/team-permissions.body.params';

describe('TeamStorageUc', () => {
	let module: TestingModule;
	let uc: CollaborativeStorageUc;

	beforeEach(async () => {
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
		});
	});
});
