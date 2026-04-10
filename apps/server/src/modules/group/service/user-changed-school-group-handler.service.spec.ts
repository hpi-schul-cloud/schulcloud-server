import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { UserChangedSchoolEvent } from '../../user/domain/events/user-changed-school.event';
import { GroupRepo } from '../repo/group.repo';
import { UserChangedSchoolGroupHandlerService } from './user-changed-school-group-handler.service';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@testing/database';
import { GroupEntity } from '../entity';

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
					useValue: await setupEntities([GroupEntity]),
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
