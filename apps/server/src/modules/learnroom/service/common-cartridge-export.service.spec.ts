import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, Lesson, Task } from '@shared/domain';
import { courseFactory, lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import { FileDto, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { FileRecordParentType } from '@src/modules/files-storage/entity';
import { CommonCartridgeExportService } from '@src/modules/learnroom/service/common-cartridge-export.service';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { LessonService } from '@src/modules/lesson/service';
import { TaskService } from '@src/modules/task/service/task.service';
import AdmZip from 'adm-zip';

describe('CommonCartridgeExportService', () => {
	let module: TestingModule;
	let courseExportService: CommonCartridgeExportService;
	let courseServiceMock: DeepMocked<CourseService>;
	let lessonServiceMock: DeepMocked<LessonService>;
	let taskServiceMock: DeepMocked<TaskService>;
	let fileStorageMock: DeepMocked<FilesStorageClientAdapterService>;

	let course: Course;
	let lessons: Lesson[];
	let tasks: Task[];

	const courseFile: FileDto = {
		id: 'test-file-id-1',
		name: 'course-file-name',
		parentType: FileRecordParentType.Course,
		parentId: 'course-id',
	};

	const lessonFile: FileDto = {
		id: 'test-file-id-2',
		name: 'lesson-file-name',
		parentType: FileRecordParentType.Lesson,
		parentId: 'lesson-id',
	};

	const taskFile: FileDto = {
		id: 'test-file-id-3',
		name: 'task-file-name',
		parentType: FileRecordParentType.Task,
		parentId: 'task-id',
	};

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
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
			],
		}).compile();
		courseExportService = module.get(CommonCartridgeExportService);
		courseServiceMock = module.get(CourseService);
		lessonServiceMock = module.get(LessonService);
		taskServiceMock = module.get(TaskService);
		fileStorageMock = module.get(FilesStorageClientAdapterService);
		course = courseFactory.buildWithId();
		lessons = lessonFactory.buildList(5);
		tasks = taskFactory.buildList(5);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('exportCourse', () => {
		let archive: AdmZip;

		beforeAll(async () => {
			courseServiceMock.findById.mockResolvedValueOnce(course);
			lessonServiceMock.findByCourseIds.mockResolvedValueOnce([lessons, lessons.length]);
			taskServiceMock.findBySingleParent.mockResolvedValueOnce([tasks, tasks.length]);
			fileStorageMock.listFilesOfParent.mockImplementation((param) => {
				if (param.parentType === FileRecordParentType.Course) {
					return Promise.resolve([courseFile]);
				}
				if (param.parentType === FileRecordParentType.Lesson) {
					return Promise.resolve([lessonFile]);
				}
				if (param.parentType === FileRecordParentType.Task) {
					return Promise.resolve([taskFile]);
				}
				return Promise.resolve([]);
			});
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

		it('should add files for the course', () => {
			const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
			expect(manifest).toContain(`i${courseFile.id}`);
		});

		it('should add files for the lessons', () => {
			const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
			expect(manifest).toContain(`i${lessonFile.id}`);
		});

		it('should add files for the tasks', () => {
			const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();
			expect(manifest).toContain(`i${taskFile.id}`);
		});
	});
});
