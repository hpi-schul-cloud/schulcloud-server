import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { GroupDeletedEvent } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Course as CourseEntity, CourseGroup } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
import { Course } from '../domain';
import { courseFactory } from '../testing';
import { CourseDoService } from './course-do.service';
import { GroupDeletedHandlerService } from './group-deleted-handler.service';

describe(GroupDeletedHandlerService.name, () => {
	let module: TestingModule;
	let service: GroupDeletedHandlerService;

	let courseService: DeepMocked<CourseDoService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				GroupDeletedHandlerService,
				{
					provide: CourseDoService,
					useValue: createMock<CourseDoService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: MikroORM,
					useValue: await setupEntities([CourseEntity, CourseGroup]),
				},
			],
		}).compile();

		service = module.get(GroupDeletedHandlerService);
		courseService = module.get(CourseDoService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('handle', () => {
		describe('when deleting a group', () => {
			const setup = () => {
				const group = groupFactory.build();
				const course: Course = courseFactory.build({
					syncedWithGroup: group.id,
					teacherIds: [new ObjectId().toHexString()],
					studentIds: [new ObjectId().toHexString()],
				});

				courseService.findBySyncedGroup.mockResolvedValueOnce([course]);

				return {
					group,
					course,
				};
			};

			it('should remove all sync references from courses', async () => {
				const { group, course } = setup();

				await service.handle(new GroupDeletedEvent(group));

				expect(courseService.saveAll).toHaveBeenCalledWith<[Course[]]>([
					new Course({
						...course.getProps(),
						syncedWithGroup: undefined,
						studentIds: [],
					}),
				]);
			});
		});
	});
});
