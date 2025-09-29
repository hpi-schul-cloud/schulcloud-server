import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { UserChangedSchoolEvent } from '../../../user/domain/events/user-changed-school.event';
import { CourseRepo } from '../../repo/course.repo';
import { UserChangedSchoolHandlerService } from './user-changed-school-handler.service';
import { courseEntityFactory } from '../../testing';
import { userFactory } from '../../../user/testing';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@testing/database';
import { CourseEntity } from '@modules/course/repo';

describe(UserChangedSchoolHandlerService.name, () => {
	let module: TestingModule;
	let service: UserChangedSchoolHandlerService;
	let courseRepo: DeepMocked<CourseRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserChangedSchoolHandlerService,
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: MikroORM,
					useValue: await setupEntities([CourseEntity]),
				},
			],
		}).compile();

		service = module.get(UserChangedSchoolHandlerService);
		courseRepo = module.get(CourseRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('handle', () => {
		it('should remove user reference from courses of the old school', async () => {
			const user = userFactory.build();
			const userId = user.id;
			const oldSchoolId = 'school456';
			const courses = [courseEntityFactory.build(), courseEntityFactory.build()];
			const event = new UserChangedSchoolEvent(userId, oldSchoolId);

			courseRepo.findAllByUserId.mockResolvedValueOnce([courses, courses.length]);

			await service.handle(event);

			expect(courseRepo.findAllByUserId).toHaveBeenCalledWith(userId, { schoolId: oldSchoolId });
			expect(courseRepo.removeUserReference).toHaveBeenCalledWith(
				userId,
				courses.map((c) => c.id)
			);
		});
	});
});
