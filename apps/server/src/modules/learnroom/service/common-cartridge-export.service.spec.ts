import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CommonCartridgeExportService, CourseService } from '@modules/learnroom';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentType, Course, LessonEntity, Task } from '@shared/domain/entity';
import { courseFactory, lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import AdmZip from 'adm-zip';
import { CommonCartridgeVersion } from '../../common-cartridge';

describe('CommonCartridgeExportService', () => {
	let module: TestingModule;
	let courseExportService: CommonCartridgeExportService;
	let courseServiceMock: DeepMocked<CourseService>;
	let lessonServiceMock: DeepMocked<LessonService>;
	let taskServiceMock: DeepMocked<TaskService>;

	// move into setup methods
	let course: Course;
	let lessons: LessonEntity[];
	let tasks: Task[];

	const createXmlString = (nodeName: string, value: boolean | number | string): string =>
		`<${nodeName}>${value.toString()}</${nodeName}>`;
	const getFileContent = (archive: AdmZip, filePath: string): string | undefined =>
		archive.getEntry(filePath)?.getData().toString();

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeExportService,
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
			],
		}).compile();
		courseExportService = module.get(CommonCartridgeExportService);
		courseServiceMock = module.get(CourseService);
		lessonServiceMock = module.get(LessonService);
		taskServiceMock = module.get(TaskService);
		// TODO: everything below this line belongs into setup methods
		course = courseFactory.teachersWithId(2).buildWithId();
		tasks = taskFactory.buildListWithId(2);
		lessons = lessonFactory.buildListWithId(1, {
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
								client: 'board-2',
								description: 'description-2',
								title: 'title-2',
								url: 'url-2',
							},
						],
					},
				},
			],
		});
	});

	afterAll(async () => {
		await module.close();
	});

	describe('exportCourse', () => {
		const setupExport = async (version: CommonCartridgeVersion) => {
			const [lesson] = lessons;

			lessonServiceMock.findById.mockResolvedValueOnce(lesson);
			courseServiceMock.findById.mockResolvedValueOnce(course);
			lessonServiceMock.findByCourseIds.mockResolvedValueOnce([lessons, lessons.length]);
			taskServiceMock.findBySingleParent.mockResolvedValueOnce([tasks, tasks.length]);

			const archive = new AdmZip(await courseExportService.exportCourse(course.id, 'user-id', version));

			return archive;
		};

		describe('when using version 1.1', () => {
			let archive: AdmZip;

			beforeAll(async () => {
				archive = await setupExport(CommonCartridgeVersion.V_1_1_0);
			});

			it('should use schema version 1.1.0', () => {
				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('schemaversion', '1.1.0'));
			});

			it('should add course', () => {
				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(
					createXmlString('mnf:string', course.name)
				);
			});

			it('should add lessons', () => {
				lessons.forEach((lesson) => {
					expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('title', lesson.name));
				});
			});

			it('should add tasks', () => {
				tasks.forEach((task) => {
					expect(getFileContent(archive, 'imsmanifest.xml')).toContain(`<resource identifier="${task.id}"`);
				});
			});

			it('should add tasks of lesson to manifest file', () => {
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
				lessons[0].tasks.getItems().forEach((task) => {
					expect(manifest).toContain(`<title>${task.name}</title>`);
					expect(manifest).toContain(`identifier="i${task.id}" type="webcontent" intendeduse="unspecified"`);
				});
			});
		});

		describe('when using version 1.3', () => {
			let archive: AdmZip;

			beforeAll(async () => {
				archive = await setupExport(CommonCartridgeVersion.V_1_3_0);
			});

			it('should use schema version 1.3.0', () => {
				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('schemaversion', '1.3.0'));
			});

			it('should add course', () => {
				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(
					createXmlString('mnf:string', course.name)
				);
			});

			it('should add lessons', () => {
				lessons.forEach((lesson) => {
					expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('title', lesson.name));
				});
			});

			it('should add tasks', () => {
				tasks.forEach((task) => {
					expect(getFileContent(archive, 'imsmanifest.xml')).toContain(`<resource identifier="${task.id}"`);
				});
			});

			it('should add tasks of lesson to manifest file', () => {
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
				lessons[0].tasks.getItems().forEach((task) => {
					expect(manifest).toContain(`<title>${task.name}</title>`);
					expect(manifest).toContain(`identifier="i${task.id}" type="webcontent" intendeduse="assignment"`);
				});
			});
		});
	});
});
