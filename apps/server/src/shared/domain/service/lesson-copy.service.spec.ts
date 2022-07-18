import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
	ComponentType,
	CopyElementType,
	CopyStatusEnum,
	IComponentGeogebraProperties,
	IComponentProperties,
	Lesson,
} from '@shared/domain';
import { courseFactory, lessonFactory, setupEntities, userFactory } from '@shared/testing';
import { CopyHelperService } from './copy-helper.service';
import { LessonCopyService } from './lesson-copy.service';

describe('lesson copy service', () => {
	let module: TestingModule;
	let copyService: LessonCopyService;
	let copyHelperService: DeepMocked<CopyHelperService>;

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
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
			],
		}).compile();

		copyService = module.get(LessonCopyService);
		copyHelperService = module.get(CopyHelperService);
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
				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);

				return { user, originalCourse, destinationCourse, originalLesson, copyName };
			};

			describe('the copied lesson', () => {
				it('should set name of copy', () => {
					const { user, destinationCourse, originalLesson, copyName } = setup();

					const response = copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
						copyName,
					});
					const lesson = response.copyEntity as Lesson;

					expect(lesson.name).toEqual(copyName);
				});

				it('should set name of copy', () => {
					const { user, destinationCourse, originalLesson } = setup();

					const response = copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as Lesson;

					expect(lesson.name).toEqual(originalLesson.name);
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

					const status = copyService.copyLesson({ originalLesson, destinationCourse, user, copyName });

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

					const metadataStatus = status.elements?.find((el) => el.type === CopyElementType.METADATA);
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
				const contentOne: IComponentProperties = {
					title: 'title component 1',
					hidden: false,
					component: ComponentType.TEXT,
					content: {
						text: 'this is a text content',
					},
				};
				const contentTwo: IComponentProperties = {
					title: 'title component 2',
					hidden: false,
					component: ComponentType.LERNSTORE,
					content: {
						resources: [
							{
								url: 'http://foo.bar',
								title: 'foo',
								description: 'bar',
								client: 'client',
								merlinReference: '',
							},
						],
					},
				};
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalLesson = lessonFactory.build({
					course: originalCourse,
					contents: [contentOne, contentTwo],
				});
				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);
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

	describe('when lesson contains LernStore content element', () => {
		const setup = () => {
			const lernStoreContent: IComponentProperties = {
				title: 'text component 1',
				hidden: false,
				component: ComponentType.LERNSTORE,
				content: {
					resources: [
						{
							url: 'https://foo.bar/baz',
							title: 'Test title',
							description: 'description',
							client: 'Schul-Cloud',
							merlinReference: '',
						},
					],
				},
			};
			const user = userFactory.build();
			const originalCourse = courseFactory.build({ school: user.school });
			const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
			const originalLesson = lessonFactory.build({
				course: originalCourse,
				contents: [lernStoreContent],
			});

			return { user, originalCourse, destinationCourse, originalLesson, lernStoreContent };
		};

		it('the content should be fully copied', () => {
			const { user, destinationCourse, originalLesson, lernStoreContent } = setup();

			const status = copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});

			const copiedLessonContents = (status.copyEntity as Lesson).contents as IComponentProperties[];
			expect(copiedLessonContents[0]).toEqual(lernStoreContent);
		});
	});

	describe('when lesson contains geoGebra content element', () => {
		const setup = () => {
			const geoGebraContent: IComponentProperties = {
				title: 'text component 1',
				hidden: false,
				component: ComponentType.GEOGEBRA,
				content: {
					materialId: 'foo',
				},
			};
			const user = userFactory.build();
			const originalCourse = courseFactory.build({ school: user.school });
			const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
			const originalLesson = lessonFactory.build({
				course: originalCourse,
				contents: [geoGebraContent],
			});

			return { user, originalCourse, destinationCourse, originalLesson };
		};

		it('geoGebra Material-ID should not be copied', () => {
			const { user, destinationCourse, originalLesson } = setup();

			const status = copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});

			const lessonContents = (status.copyEntity as Lesson).contents as IComponentProperties[];
			const geoGebraContent = lessonContents[0].content as IComponentGeogebraProperties;

			expect(geoGebraContent.materialId).toEqual('');
		});

		it('element should be hidden', () => {
			const { user, destinationCourse, originalLesson } = setup();

			const status = copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});

			const lessonContents = (status.copyEntity as Lesson).contents as IComponentProperties[];
			expect(lessonContents[0].hidden).toEqual(true);
		});
	});
});
