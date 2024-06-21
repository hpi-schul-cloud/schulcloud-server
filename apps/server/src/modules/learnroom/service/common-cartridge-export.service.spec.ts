import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ColumnBoardService } from '@modules/board';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	linkElementFactory,
	richTextElementFactory,
} from '@modules/board/testing';
import { CommonCartridgeVersion } from '@modules/common-cartridge';
import { CommonCartridgeExportService, CourseService, LearnroomConfig } from '@modules/learnroom';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentType } from '@shared/domain/entity';
import { courseFactory, lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import AdmZip from 'adm-zip';
import { CommonCartridgeExportMapper } from '../mapper/common-cartridge-export.mapper';

describe('CommonCartridgeExportService', () => {
	let module: TestingModule;
	let sut: CommonCartridgeExportService;
	let courseServiceMock: DeepMocked<CourseService>;
	let lessonServiceMock: DeepMocked<LessonService>;
	let taskServiceMock: DeepMocked<TaskService>;
	let configServiceMock: DeepMocked<ConfigService<LearnroomConfig, true>>;
	let columnBoardServiceMock: DeepMocked<ColumnBoardService>;

	const createXmlString = (nodeName: string, value: boolean | number | string): string =>
		`<${nodeName}>${value.toString()}</${nodeName}>`;
	const getFileContent = (archive: AdmZip, filePath: string): string | undefined =>
		archive.getEntry(filePath)?.getData().toString();
	const setupParams = async (
		version: CommonCartridgeVersion,
		exportTopics: boolean,
		exportTasks: boolean,
		exportColumnBoards: boolean
	) => {
		const course = courseFactory.teachersWithId(2).buildWithId();
		const tasks = taskFactory.buildListWithId(2);
		const lessons = lessonFactory.buildListWithId(1, {
			contents: [
				{
					title: 'text-title',
					hidden: false,
					component: ComponentType.TEXT,
					content: {
						text: 'text',
					},
				},
				{
					title: 'lernstore-title',
					hidden: false,
					component: ComponentType.LERNSTORE,
					content: {
						resources: [
							{
								client: 'client-1',
								description: 'description-1',
								title: 'title-1',
								url: 'url-1',
							},
							{
								client: 'client-2',
								description: 'description-2',
								title: 'title-2',
								url: 'url-2',
							},
						],
					},
				},
			],
		});
		const [lesson] = lessons;
		const taskFromLesson = taskFactory.buildWithId({ course, lesson });
		const textCardElement = richTextElementFactory.build();
		const linkElement = linkElementFactory.build();
		const card = cardFactory.build({ children: [textCardElement, linkElement] });
		const column = columnFactory.build({ children: [card] });
		const columnBoard = columnBoardFactory.build({ children: [column] });

		lessonServiceMock.findById.mockResolvedValue(lesson);
		courseServiceMock.findById.mockResolvedValue(course);
		lessonServiceMock.findByCourseIds.mockResolvedValue([lessons, lessons.length]);
		taskServiceMock.findBySingleParent.mockResolvedValue([tasks, tasks.length]);
		configServiceMock.getOrThrow.mockReturnValue(faker.internet.url());
		columnBoardServiceMock.findByExternalReference.mockResolvedValue([columnBoard]);
		columnBoardServiceMock.findById.mockResolvedValue(columnBoard);

		const buffer = await sut.exportCourse(
			course.id,
			faker.string.uuid(),
			version,
			exportTopics ? [lesson.id] : [],
			exportTasks ? tasks.map((task) => task.id) : [],
			exportColumnBoards ? [columnBoard.id] : []
		);
		const archive = new AdmZip(buffer);

		return { archive, course, lessons, tasks, taskFromLesson, columnBoard, column, card, textCardElement, linkElement };
	};

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeExportService,
				CommonCartridgeExportMapper,
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
				},
				{
					provide: TaskService,
					useValue: createMock<TaskService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<LearnroomConfig, true>>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
			],
		}).compile();
		sut = module.get(CommonCartridgeExportService);
		courseServiceMock = module.get(CourseService);
		lessonServiceMock = module.get(LessonService);
		taskServiceMock = module.get(TaskService);
		configServiceMock = module.get(ConfigService);
		columnBoardServiceMock = module.get(ColumnBoardService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('exportCourse', () => {
		describe('when using version 1.1', () => {
			const setup = async () => setupParams(CommonCartridgeVersion.V_1_1_0, true, true, true);

			it('should use schema version 1.1.0', async () => {
				const { archive } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('schemaversion', '1.1.0'));
			});

			it('should add course', async () => {
				const { archive, course } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('mnf:string', course.name));
			});

			it('should add lessons', async () => {
				const { archive, lessons } = await setup();

				lessons.forEach((lesson) => {
					expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('title', lesson.name));
				});
			});

			it('should add tasks', async () => {
				const { archive, tasks } = await setup();

				tasks.forEach((task) => {
					expect(getFileContent(archive, 'imsmanifest.xml')).toContain(`<resource identifier="i${task.id}"`);
				});
			});

			it('should add tasks of lesson to manifest file', async () => {
				const { archive, lessons } = await setup();
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();

				lessons[0].tasks.getItems().forEach((task) => {
					expect(manifest).toContain(`<title>${task.name}</title>`);
					expect(manifest).toContain(`identifier="i${task.id}" type="webcontent" intendeduse="unspecified"`);
				});
			});

			it('should add column boards', async () => {
				const { archive, columnBoard } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', columnBoard.title));
			});

			it('should add column', async () => {
				const { archive, column } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', column.title ?? ''));
			});

			it('should add card', async () => {
				const { archive, card } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', card.title ?? ''));
			});

			it('should add content element of cards', async () => {
				const { archive, textCardElement } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(`<resource identifier="i${textCardElement.id}"`);
			});

			it('should add link element of card', async () => {
				const { archive, linkElement } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(`<resource identifier="i${linkElement.id}"`);
			});
		});

		describe('when using version 1.3', () => {
			const setup = async () => setupParams(CommonCartridgeVersion.V_1_3_0, true, true, true);

			it('should use schema version 1.3.0', async () => {
				const { archive } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('schemaversion', '1.3.0'));
			});

			it('should add course', async () => {
				const { archive, course } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('mnf:string', course.name));
			});

			it('should add lessons', async () => {
				const { archive, lessons } = await setup();

				lessons.forEach((lesson) => {
					expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('title', lesson.name));
				});
			});

			it('should add tasks', async () => {
				const { archive, tasks } = await setup();

				tasks.forEach((task) => {
					expect(getFileContent(archive, 'imsmanifest.xml')).toContain(`<resource identifier="i${task.id}"`);
				});
			});

			it('should add tasks of lesson to manifest file', async () => {
				const { archive, lessons } = await setup();
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();

				lessons[0].tasks.getItems().forEach((task) => {
					expect(manifest).toContain(`<title>${task.name}</title>`);
					expect(manifest).toContain(`identifier="i${task.id}" type="webcontent" intendeduse="assignment"`);
				});
			});

			it('should add column boards', async () => {
				const { archive, columnBoard } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', columnBoard.title));
			});

			it('should add column', async () => {
				const { archive, column } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', column.title ?? ''));
			});

			it('should add card', async () => {
				const { archive, card } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', card.title ?? ''));
			});

			it('should add content element of cards', async () => {
				const { archive, textCardElement } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(`<resource identifier="i${textCardElement.id}"`);
			});

			it('should add link element of card', async () => {
				const { archive, linkElement } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(`<resource identifier="i${linkElement.id}"`);
			});
		});

		describe('When topics array is empty', () => {
			const setup = async () => setupParams(CommonCartridgeVersion.V_1_1_0, false, true, true);

			it("shouldn't add lessons", async () => {
				const { archive, lessons } = await setup();

				lessons.forEach((lesson) => {
					expect(getFileContent(archive, 'imsmanifest.xml')).not.toContain(createXmlString('title', lesson.name));
				});
			});
		});

		describe('When tasks array is empty', () => {
			const setup = async () => setupParams(CommonCartridgeVersion.V_1_1_0, true, false, true);

			it("shouldn't add tasks", async () => {
				const { archive, tasks } = await setup();

				tasks.forEach((task) => {
					expect(getFileContent(archive, 'imsmanifest.xml')).not.toContain(`<resource identifier="i${task.id}"`);
				});
			});
		});

		describe('When columnBoards array is empty', () => {
			const setup = async () => setupParams(CommonCartridgeVersion.V_1_1_0, true, true, false);

			it("shouldn't add column boards", async () => {
				const { archive, columnBoard } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).not.toContain(createXmlString('title', columnBoard.title));
			});
		});
	});
});
