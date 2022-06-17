import { TeamStorageController } from '@src/modules/team-storage/controller/team-storage.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamStorageUc } from '@src/modules/team-storage/uc/team-storage.uc';
import { createMock } from '@golevelup/ts-jest';
import { ICurrentUser } from '@shared/domain';

describe('TeamStorage Controller', () => {
	let module: TestingModule;
	let controller: TeamStorageController;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TeamStorageController,
				{
					provide: TeamStorageUc,
					useValue: createMock<TeamStorageUc>(),
				},
			],
		}).compile();
		controller = module.get(TeamStorageController);
	});

	describe('Update TeamPermissions For Role', () => {
		it('should call the UC', async () => {
			await controller.updateTeamPermissionsForRole(
				{ userId: 'userId' } as ICurrentUser,
				{ team: 'testTeam', role: 'testRole' },
				{ read: false, write: false, create: false, delete: false, share: false }
			);
		});
	});
});
