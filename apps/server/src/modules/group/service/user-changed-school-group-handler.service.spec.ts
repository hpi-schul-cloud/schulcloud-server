import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { Test, type TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { UserChangedSchoolEvent } from '../../user/domain/events/user-changed-school.event';
import { GroupEntity } from '../entity';
import { GroupRepo } from '../repo/group.repo';
import { UserChangedSchoolGroupHandlerService } from './user-changed-school-group-handler.service';

describe(UserChangedSchoolGroupHandlerService.name, () => {
	let module: TestingModule;
	let service: UserChangedSchoolGroupHandlerService;
	let groupRepo: DeepMocked<GroupRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserChangedSchoolGroupHandlerService,
				{
					provide: GroupRepo,
					useValue: createMock<GroupRepo>(),
				},
				{
					provide: MikroORM,
					useValue: await setupEntities([GroupEntity, SchoolSystemOptionsEntity, UserLoginMigrationEntity]),
				},
			],
		}).compile();

		service = module.get(UserChangedSchoolGroupHandlerService);
		groupRepo = module.get(GroupRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('handle', () => {
		it('should remove user reference from all groups the user is part of', async () => {
			const userId = 'user123';
			const event = new UserChangedSchoolEvent(userId, 'school456');

			await service.handle(event);

			expect(groupRepo.removeUserReference).toHaveBeenCalledWith(userId);
		});
	});
});
