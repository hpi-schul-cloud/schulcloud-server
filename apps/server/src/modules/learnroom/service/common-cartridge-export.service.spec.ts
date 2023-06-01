import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentType, Course, IComponentProperties, IComponentTextProperties, Lesson, Task } from '@shared/domain';
import { courseFactory, lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import { CommonCartridgeExportService } from '@src/modules/learnroom/service/common-cartridge-export.service';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { LessonService } from '@src/modules/lesson/service';
import { TaskService } from '@src/modules/task/service/task.service';
import AdmZip from 'adm-zip';
import { CommonCartridgeVersion } from '../common-cartridge';

describe('CommonCartridgeExportService', () => {
	let module: TestingModule;
	let courseExportService: CommonCartridgeExportService;
	let courseServiceMock: DeepMocked<CourseService>;
	let lessonServiceMock: DeepMocked<LessonService>;
	let taskServiceMock: DeepMocked<TaskService>;

	let course: Course;
	let lessons: Lesson[];
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
		lessons = lessonFactory.buildListWithId(5, {
			contents: [
				{
					component: ComponentType.TEXT,
					title: 'Text',
					content: {
						text: 'text',
					},
				} as IComponentProperties,
				{
					component: ComponentType.ETHERPAD,
					title: 'Etherpad',
					content: {
						url: 'url',
					},
				} as IComponentProperties,
				{
					component: ComponentType.GEOGEBRA,
					title: 'Geogebra',
					content: {
						materialId: 'materialId',
					},
				} as IComponentProperties,
				{} as IComponentProperties,
			],
		});
		tasks = taskFactory.buildList(5);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('exportCourse', () => {
		let archive: AdmZip;

		beforeAll(async () => {
			const [lesson] = lessons;
			const textContent = { text: 'Some random text' } as IComponentTextProperties;
			const lessonContent: IComponentProperties = {
				_id: 'random_id',
				title: 'A random title',
				hidden: false,
				component: ComponentType.TEXT,
				content: textContent,
			};
			const version: CommonCartridgeVersion = CommonCartridgeVersion.V_1_1_0;
			lesson.contents = [lessonContent];
			lessonServiceMock.findById.mockResolvedValueOnce(lesson);
			courseServiceMock.findById.mockResolvedValueOnce(course);
			lessonServiceMock.findByCourseIds.mockResolvedValueOnce([lessons, lessons.length]);
			taskServiceMock.findBySingleParent.mockResolvedValueOnce([tasks, tasks.length]);
			archive = new AdmZip(await courseExportService.exportCourse(course.id, '', version));
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
		// TODO: will be done in EW-526: https://ticketsystem.dbildungscloud.de/browse/EW-526
		// it('should add tasks as assignments', () => {
		// 	const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
		// 	tasks.forEach((task) => {
		// 		expect(manifest).toContain(`i${task.id}`);
		// 	});
		// });
	});
});
