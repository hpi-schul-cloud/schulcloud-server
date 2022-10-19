import AdmZip from 'adm-zip';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseExportService } from '@src/modules/learnroom/service/course-export.service';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LessonService } from '@src/modules/lesson/service';
import { courseFactory, lessonFactory, setupEntities } from '@shared/testing';
import { Course, Lesson } from '@shared/domain';
import { MikroORM } from '@mikro-orm/core';

describe('CourseExportService', () => {
	let orm: MikroORM;
	let module: TestingModule;
	let courseExportService: CourseExportService;
	let courseServiceMock: DeepMocked<CourseService>;
	let lessonServiceMock: DeepMocked<LessonService>;

	let course: Course;
	let lessons: Lesson[];

	beforeAll(async () => {
		orm = await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				CourseExportService,
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
				},
			],
		}).compile();
		courseExportService = module.get(CourseExportService);
		courseServiceMock = module.get(CourseService);
		lessonServiceMock = module.get(LessonService);
		course = courseFactory.buildWithId();
		lessons = lessonFactory.buildList(5);
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
			archive = new AdmZip(await courseExportService.exportCourse(course.id));
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
	});
});
