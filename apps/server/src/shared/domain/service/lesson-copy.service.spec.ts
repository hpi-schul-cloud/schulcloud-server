import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentType, CopyElementType, CopyStatusEnum, Lesson } from '@shared/domain';
import { courseFactory, lessonFactory, setupEntities, userFactory } from '@shared/testing';
import { LessonCopyService } from './lesson-copy.service';
import { NameCopyService } from './name-copy.service';

describe('lesson copy service', () => {
	let module: TestingModule;
	let copyService: LessonCopyService;
	let nameCopyService: DeepMocked<NameCopyService>;

	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				LessonCopyService,
				{
					provide: NameCopyService,
					useValue: createMock<NameCopyService>(),
				},
			],
		}).compile();

		copyService = module.get(LessonCopyService);
		nameCopyService = module.get(NameCopyService);
	});

	describe('handleCopyLesson', () => {
		describe('when copying a lesson within original course', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalLesson = lessonFactory.build({
					course: originalCourse,
				});

				const copyName = 'Copy';
				nameCopyService.deriveCopyName.mockReturnValue(copyName);

				return { user, originalCourse, destinationCourse, originalLesson, copyName };
			};

			describe('the copied lesson', () => {
				it('should set name of copy', () => {
					const { user, destinationCourse, originalLesson, copyName } = setup();

					const response = copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as Lesson;

					expect(lesson.name).toEqual(copyName);
				});

				it('should use nameCopyService', () => {
					const { user, destinationCourse, originalLesson } = setup();

					copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});

					expect(nameCopyService.deriveCopyName).toHaveBeenCalledWith(originalLesson.name);
				});

				it('should set course of the copy', () => {
					const { user, destinationCourse, originalLesson } = setup();

					const response = copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as Lesson;

					expect(lesson.course).toEqual(destinationCourse);
				});

				it('should set the position of copy', () => {
					const { user, destinationCourse, originalLesson } = setup();

					const response = copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as Lesson;

					expect(lesson.position).toEqual(originalLesson.position);
				});

				it('should set the hidden property of copy', () => {
					const { user, destinationCourse, originalLesson } = setup();

					const response = copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as Lesson;

					expect(lesson.hidden).toEqual(true);
				});
			});

			describe('the response', () => {
				it('should set status title to the name of the lesson', () => {
					const { destinationCourse, originalLesson, user, copyName } = setup();

					const status = copyService.copyLesson({ originalLesson, destinationCourse, user });

					expect(status.title).toEqual(copyName);
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

				it('should set lesson status', () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});

					expect(status.status).toEqual(CopyStatusEnum.SUCCESS);
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

		describe('when lesson contains no content', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalLesson = lessonFactory.build({
					course: originalCourse,
				});

				return { user, originalCourse, destinationCourse, originalLesson };
			};

			it('contents array of copied lesson should be empty', () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});

				const lesson = status.copyEntity as Lesson;

				expect(lesson.contents.length).toEqual(0);
			});

			it('should not set contents status group', () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});
				const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
				expect(contentsStatus).not.toBeDefined();
			});
		});

		describe('when lesson contains at least one content element', () => {
			const setup = () => {
				const textContentOne = {
					title: 'text component 1',
					hidden: false,
					component: ComponentType.TEXT,
					content: {
						text: 'this is a text content',
					},
				};
				const textContentTwo = {
					title: 'text component 2',
					hidden: false,
					component: ComponentType.TEXT,
					content: {
						text: 'this is another text content',
					},
				};
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalLesson = lessonFactory.build({
					course: originalCourse,
					contents: [textContentOne, textContentTwo],
				});

				return { user, originalCourse, destinationCourse, originalLesson };
			};

			it('contents array of copied lesson should contain content elments of original lesson', () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});

				const lesson = status.copyEntity as Lesson;

				expect(lesson.contents.length).toEqual(2);
				expect(lesson.contents).toEqual(originalLesson.contents);
			});

			it('copied content should persist the original hidden value', () => {
				const { user, destinationCourse, originalLesson } = setup();
				originalLesson.contents[0].hidden = true;
				originalLesson.contents[1].hidden = false;

				const status = copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});

				const lesson = status.copyEntity as Lesson;

				expect(lesson.contents[0].hidden).toEqual(true);
				expect(lesson.contents[1].hidden).toEqual(false);
			});

			it('should set contents status group with correct amount of children status elements', () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});
				const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
				expect(contentsStatus).toBeDefined();
				expect(contentsStatus?.elements?.length).toEqual(2);
				if (contentsStatus?.elements && contentsStatus?.elements[0]) {
					expect(contentsStatus?.elements[0].status).toEqual(CopyStatusEnum.SUCCESS);
				}
			});

			it('should set contents status group with correct status', () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});
				const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
				expect(contentsStatus).toBeDefined();
				expect(contentsStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});
		});
	});
});
