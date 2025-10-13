import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { UserChangedSchoolEvent } from '../../user/domain/events/user-changed-school.event';
import { ClassesRepo } from '../repo';
import { UserChangedSchoolHandlerService } from './user-changed-school-handler.service';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@testing/database';
import { ClassEntity } from '../entity';
import { classFactory } from '../domain/testing';

describe(UserChangedSchoolHandlerService.name, () => {
	let module: TestingModule;
	let service: UserChangedSchoolHandlerService;
	let classesRepo: DeepMocked<ClassesRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserChangedSchoolHandlerService,
				{
					provide: ClassesRepo,
					useValue: createMock<ClassesRepo>(),
				},
				{
					provide: MikroORM,
					useValue: await setupEntities([ClassEntity]),
				},
			],
		}).compile();

		service = module.get(UserChangedSchoolHandlerService);
		classesRepo = module.get(ClassesRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('handle', () => {
		it('should remove user reference from all classes the user is part of', async () => {
			const userId = 'user123';
			const event = new UserChangedSchoolEvent(userId, 'school456');
			const classes = [classFactory.build(), classFactory.build(), classFactory.build()];
			classesRepo.findAllByUserId.mockResolvedValueOnce(classes);

			await service.handle(event);

			expect(classesRepo.findAllByUserId).toHaveBeenCalledWith(userId);
			expect(classesRepo.removeUserReference).toHaveBeenCalledWith(
				userId,
				classes.map((c) => c.id)
			);
		});
	});
});
