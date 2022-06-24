import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, lessonFactory, setupEntities, userFactory } from '@shared/testing';
import { CopyElementType, CopyStatusEnum, Lesson } from '@shared/domain';
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

			describe('the copy lesson', () => {
				it('should set status title to the name of the lesson', () => {
					const { destinationCourse, originalLesson, user } = setup();

					const result = copyService.copyLesson({ originalLesson, destinationCourse, user });

					expect(result.title).toEqual(originalLesson.name);
				});

				/*
                it('should set copy as draft', () => {
                    const { user, destinationCourse, originalLesson } = setup();
    
                    const status = copyService.copyLesson({
                        originalLesson,
                        destinationCourse,
                        user,
                    });
    
                    const lesson = status.copyEntity as Lesson;
                    expect(lesson.hidden).toEqual(true);
                });
                */

				it('should set name of copy', () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});

					const lesson = status.copyEntity as Lesson;
					expect(lesson.name).toEqual(originalLesson.name);
				});

				it('should set course of the copy', () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});

					const lesson = status.copyEntity as Lesson;
					expect(lesson.course).toEqual(destinationCourse);
				});
			});

			describe('the response', () => {
				it('should set status title to title of the copy', () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});

					const lesson = status.copyEntity as Lesson;
					expect(status.title).toEqual(lesson.name);
				});

				it('should set status type to lesson', () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});

					expect(status.type).toEqual(CopyElementType.LESSON);
				});

				it('should set status of metadata', () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});

					const metadataStatus = status.elements?.find(
						(el) => el.type === CopyElementType.LEAF && el.title === 'metadata'
					);
					expect(metadataStatus).toBeDefined();
					expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
				});
			});
		});

		describe('when copying into a different course', () => {
			it('should set destination course as course of the copy', () => {
				const originalCourse = courseFactory.build({});
				const destinationCourse = courseFactory.build({});
				const user = userFactory.build({});
				const originalLesson = lessonFactory.build({ course: originalCourse });

				const status = copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});

				const lesson = status.copyEntity as Lesson;
				expect(lesson.course).toEqual(destinationCourse);
			});
		});
	});
});
