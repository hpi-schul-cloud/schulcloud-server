import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CommonCartridgeExportService, CourseService } from '@modules/learnroom';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Test, TestingModule } from '@nestjs/testing';
import {
	ComponentLernstoreProperties,
	ComponentProperties,
	ComponentTextProperties,
	ComponentType,
	Course,
	LessonEntity,
	Task,
} from '@shared/domain';
import { courseFactory, lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import AdmZip from 'adm-zip';
import { writeFile } from 'fs/promises';
import { CommonCartridgeVersion } from '../common-cartridge';

describe('CommonCartridgeExportService', () => {
	let module: TestingModule;
	let courseExportService: CommonCartridgeExportService;
	let courseServiceMock: DeepMocked<CourseService>;
	let lessonServiceMock: DeepMocked<LessonService>;
	let taskServiceMock: DeepMocked<TaskService>;

	let course: Course;
	let lessons: LessonEntity[];
	let tasks: Task[];

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
		course = courseFactory.teachersWithId(2).buildWithId();
		lessons = lessonFactory.buildListWithId(1, {
			contents: [
				{
					_id: faker.string.uuid(),
					hidden: false,
					component: ComponentType.TEXT,
					title: 'Text',
					content: {
						text: 'text',
					},
				} as ComponentProperties,
				{
					_id: faker.string.uuid(),
					hidden: false,
					component: ComponentType.ETHERPAD,
					title: 'Etherpad',
					content: {
						title: faker.lorem.words(2),
						description: faker.lorem.sentence(),
						url: 'https://google.com',
					},
				} as ComponentProperties,
				{
					_id: faker.string.uuid(),
					hidden: false,
					component: ComponentType.GEOGEBRA,
					title: 'Geogebra',
					content: {
						materialId: 'https://google.com',
					},
				} as ComponentProperties,
				{} as ComponentProperties,
			],
		});
		tasks = taskFactory.buildListWithId(2);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('exportCourse', () => {
		const setupExport = async (version: CommonCartridgeVersion) => {
			const [lesson] = lessons;
			const textContent = { text: 'Some random text' } as ComponentTextProperties;
			const lessonContent: ComponentProperties = {
				_id: 'random_id',
				title: 'A random title',
				hidden: false,
				component: ComponentType.TEXT,
				content: textContent,
			};
			lesson.contents = [lessonContent];
			lessonServiceMock.findById.mockResolvedValueOnce(lesson);
			courseServiceMock.findById.mockResolvedValueOnce(course);
			lessonServiceMock.findByCourseIds.mockResolvedValueOnce([lessons, lessons.length]);
			taskServiceMock.findBySingleParent.mockResolvedValueOnce([tasks, tasks.length]);

			const archive = new AdmZip(await courseExportService.exportCourse(course.id, '', version));

			return archive;
		};

		describe('When Common Cartridge version 1.1', () => {
			let archive: AdmZip;

			beforeAll(async () => {
				archive = await setupExport(CommonCartridgeVersion.V_1_1_0);
			});

			it('should create manifest file', () => {
				expect(archive.getEntry('imsmanifest.xml')).toBeDefined();
			});

			it('should add title to manifest file', () => {
				expect(archive.getEntry('imsmanifest.xml')?.getData().toString()).toContain(course.name);
			});

			it('should add lessons as organization items to manifest file', () => {
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
				lessons.forEach((lesson) => {
					expect(manifest).toContain(lesson.name);
				});
			});

			it('should add lesson text content to manifest file', () => {
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
				expect(manifest).toContain(lessons[0].contents[0].title);
			});

			it('should add copyright information to manifest file', () => {
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
				expect(manifest).toContain(course.teachers[0].firstName);
				expect(manifest).toContain(course.teachers[0].lastName);
				expect(manifest).toContain(course.teachers[1].firstName);
				expect(manifest).toContain(course.teachers[1].lastName);
				expect(manifest).toContain(course.createdAt.getFullYear().toString());
			});

			it('should add tasks as assignments', () => {
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
				tasks.forEach((task) => {
					expect(manifest).toContain(`<title>${task.name}</title>`);
					expect(manifest).toContain(`identifier="i${task.id}" type="webcontent" intendeduse="unspecified"`);
				});
			});

			it('should add version 1 information to manifest file', () => {
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
				expect(manifest).toContain(CommonCartridgeVersion.V_1_1_0);
			});
		});

		describe('When Common Cartridge version 1.3', () => {
			let archive: AdmZip;

			beforeAll(async () => {
				archive = await setupExport(CommonCartridgeVersion.V_1_3_0);
			});

			it('should create manifest file', () => {
				expect(archive.getEntry('imsmanifest.xml')).toBeDefined();
			});

			it('should add title to manifest file', () => {
				expect(archive.getEntry('imsmanifest.xml')?.getData().toString()).toContain(course.name);
			});

			it('should add lessons as organization items to manifest file', () => {
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
				lessons.forEach((lesson) => {
					expect(manifest).toContain(lesson.name);
				});
			});

			it('should add lesson text content to manifest file', () => {
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
				expect(manifest).toContain(lessons[0].contents[0].title);
			});

			it('should add copyright information to manifest file', () => {
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
				expect(manifest).toContain(course.teachers[0].firstName);
				expect(manifest).toContain(course.teachers[0].lastName);
				expect(manifest).toContain(course.teachers[1].firstName);
				expect(manifest).toContain(course.teachers[1].lastName);
				expect(manifest).toContain(course.createdAt.getFullYear().toString());
			});

			it('should add tasks as assignments', () => {
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
				tasks.forEach((task) => {
					expect(manifest).toContain(`<title>${task.name}</title>`);
					expect(manifest).toContain(`identifier="i${task.id}" type="webcontent" intendeduse="assignment"`);
				});
			});

			it('should add version 3 information to manifest file', () => {
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
				expect(manifest).toContain(CommonCartridgeVersion.V_1_3_0);
			});
		});

		describe('when exporting learn store content from course with Common Cartridge 1.3', () => {
			let archive: AdmZip;
			let lernstoreProps: ComponentProperties;

			beforeAll(async () => {
				const [lesson] = lessons;

				archive = await setupExport(CommonCartridgeVersion.V_1_3_0);
				lernstoreProps = lesson.contents.filter((content) => content.component === ComponentType.LERNSTORE)[0];

				await writeFile('test.zip', archive.toBuffer(), 'binary');
			});

			it('should add learn store content to manifest file', () => {
				// AI next 3 lines
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();

				expect(manifest).toContain(lernstoreProps.title);
			});

			it.skip('should create directory for each learn store content', () => {
				// AI next 3 lines
				const directory = archive.getEntry(`i${lernstoreProps._id as string}/`);

				expect(directory).toBeDefined();
			});

			it.skip('should add learn store content as web links to directory', () => {
				expect(lernstoreProps.content).toBeDefined();
				expect((lernstoreProps.content as ComponentLernstoreProperties).resources).toHaveLength(2);

				(lernstoreProps.content as ComponentLernstoreProperties).resources.forEach((resource) => {
					const file = archive.getEntry(`i${lernstoreProps._id as string}/${resource.title}.html`);

					expect(file).toBeDefined();
				});
			});
		});
	});
});
