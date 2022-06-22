import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, lessonFactory, setupEntities, userFactory } from '@shared/testing';
import { LessonCopyService } from './lesson-copy.service';

describe('course copy service', () => {
	let module: TestingModule;
	let copyService: LessonCopyService;

	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [LessonCopyService],
		}).compile();

		copyService = module.get(LessonCopyService);
	});

	describe('handleCopyLesson', () => {
		describe('when copying a lesson within original course', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalLesson = lessonFactory.build({ course: originalCourse });

				return { user, originalCourse, destinationCourse, originalLesson };
			};

			it('should set status title to the name of the lesson', () => {
				const { destinationCourse, originalLesson, user } = setup();

				const result = copyService.copyLesson({ destinationCourse, originalLesson, user });

				expect(result.status.title).toEqual(originalLesson.name);
			});
		});
	});
});
