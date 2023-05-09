import { CollaborativeStorageController } from '@src/modules/collaborative-storage/controller/collaborative-storage.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { CollaborativeStorageUc } from '@src/modules/collaborative-storage/uc/collaborative-storage.uc';
import { createMock } from '@golevelup/ts-jest';
import { ICurrentUser } from '@src/modules/authentication';
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
				{ userId: 'userId' } as ICurrentUser,
				{ teamId: 'testTeam', roleId: 'testRole' },
				{ read: false, write: false, create: false, delete: false, share: false }
			);
		});
	});
});
