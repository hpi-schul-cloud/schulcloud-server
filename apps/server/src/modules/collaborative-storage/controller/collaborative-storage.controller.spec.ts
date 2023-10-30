import { Test, TestingModule } from '@nestjs/testing';

import { createMock } from '@golevelup/ts-jest';
import { LegacyLogger } from '@src/core/logger/legacy-logger.service';
import { ICurrentUser } from '@src/modules/authentication/interface/user';
import { CollaborativeStorageUc } from '../uc/collaborative-storage.uc';
import { CollaborativeStorageController } from './collaborative-storage.controller';

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
