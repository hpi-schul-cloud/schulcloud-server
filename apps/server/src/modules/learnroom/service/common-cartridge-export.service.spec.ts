import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, Lesson, Task } from '@shared/domain';
import { courseFactory, lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import { CommonCartridgeExportService } from '@src/modules/learnroom/service/common-cartridge-export.service';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { LessonService } from '@src/modules/lesson/service';
import { TaskService } from '@src/modules/task/service/task.service';
import AdmZip from 'adm-zip';

describe('CommonCartridgeExportService', () => {
	let orm: MikroORM;
	let module: TestingModule;
	let courseExportService: CommonCartridgeExportService;
	let courseServiceMock: DeepMocked<CourseService>;
	let lessonServiceMock: DeepMocked<LessonService>;
	let taskServiceMock: DeepMocked<TaskService>;

	let course: Course;
	let lessons: Lesson[];
	let tasks: Task[];

	beforeAll(async () => {
		orm = await setupEntities();
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
		course = courseFactory.buildWithId();
		lessons = lessonFactory.buildList(5);
		tasks = taskFactory.buildList(5);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	describe('exportCourse', () => {
		let archive: AdmZip;

		beforeAll(async () => {
			courseServiceMock.findById.mockResolvedValueOnce(course);
			lessonServiceMock.findByCourseIds.mockResolvedValueOnce([lessons, lessons.length]);
			taskServiceMock.findBySingleParent.mockResolvedValueOnce([tasks, tasks.length]);
			archive = new AdmZip(await courseExportService.exportCourse(course.id, ''));
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

		it('should add tasks as assignments', () => {
			const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
			tasks.forEach((task) => {
				expect(manifest).toContain(`i${task.id}`);
			});
		});
	});
});
