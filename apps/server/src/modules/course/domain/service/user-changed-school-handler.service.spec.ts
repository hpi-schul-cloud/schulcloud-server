import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { schoolEntityFactory } from '@modules/school/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { UserChangedSchoolEvent } from '../../../user/domain/events/user-changed-school.event';
import { userFactory } from '../../../user/testing';
import { CourseEntity, CourseGroupEntity } from '../../repo';
import { CourseRepo } from '../../repo/course.repo';
import { UserChangedSchoolHandlerService } from './user-changed-school-handler.service';

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
					useValue: await setupEntities([CourseEntity, CourseGroupEntity]),
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
