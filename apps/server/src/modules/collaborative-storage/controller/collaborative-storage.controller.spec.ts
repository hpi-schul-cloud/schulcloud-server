import { createMock } from '@golevelup/ts-jest';
import { CurrentUserInterface } from '@modules/authentication';
import { CollaborativeStorageController } from '@modules/collaborative-storage/controller/collaborative-storage.controller';
import { CollaborativeStorageUc } from '@modules/collaborative-storage/uc/collaborative-storage.uc';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyLogger } from '@src/core/logger';

describe('CollaborativeStorage Controller', () => {
	let module: TestingModule;
	let controller: CollaborativeStorageController;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CollaborativeStorageController,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: CollaborativeStorageUc,
					useValue: createMock<CollaborativeStorageUc>(),
				},
			],
		}).compile();
		controller = module.get(CollaborativeStorageController);
	});

	describe('Update TeamPermissions For Role', () => {
		it('should call the UC', async () => {
			await controller.updateTeamPermissionsForRole(
				{ userId: 'userId' } as CurrentUserInterface,
				{ teamId: 'testTeam', roleId: 'testRole' },
				{ read: false, write: false, create: false, delete: false, share: false }
			);
		});
	});
});
