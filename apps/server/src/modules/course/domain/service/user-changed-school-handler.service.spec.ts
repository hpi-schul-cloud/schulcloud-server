import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { UserChangedSchoolEvent } from '../../../user/domain/events/user-changed-school.event';
import { CourseRepo } from '../../repo/course.repo';
import { UserChangedSchoolHandlerService } from './user-changed-school-handler.service';
import { userFactory } from '../../../user/testing';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@testing/database';
import { CourseEntity } from '../../repo';
import { schoolEntityFactory } from '@modules/school/testing';

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
		it('should call removeUserFromCourses with correct parameters', async () => {
			const school = schoolEntityFactory.buildWithId();
			const user = userFactory.build({ school });
			const userId = user.id;
			const oldSchoolId = 'school456';
			const event = new UserChangedSchoolEvent(userId, oldSchoolId);

			await service.handle(event);

			expect(courseRepo.removeUserFromCourses).toHaveBeenCalledWith(userId, oldSchoolId);
		});
	});
});
