import { FileRecordParentType } from '@infra/rabbitmq';
import { StorageLocation } from '@modules/files-storage/interface';
import { Course, CourseGroup, LessonEntity, Material, Submission, Task, User } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
import { lessonFactory } from '@testing/factory/lesson.factory';
import { taskFactory } from '@testing/factory/task.factory';
import { FileParamBuilder } from './files-storage-param.builder';

describe('FileParamBuilder', () => {
	beforeAll(async () => {
		await setupEntities([User, Task, Submission, LessonEntity, Material, Course, CourseGroup]);
	});

	it('Should throw for not supported parent type', () => {
		const schoolId = '123';
		const parentType = 'abc';

		// @ts-expect-error: Test case
		expect(() => FileParamBuilder.build(schoolId, parentType, StorageLocation.SCHOOL)).toThrowError();
	});

	it('should build valid file request infos for task over shorthand task', () => {
		const schoolId = '123';
		const parentType = FileRecordParentType.Task;
		const task = taskFactory.buildWithId();

		const result = FileParamBuilder.build(schoolId, task, StorageLocation.SCHOOL);

		const expectedResult = {
			storageLocationId: schoolId,
			parentType,
			parentId: task.id,
			storageLocation: StorageLocation.SCHOOL,
		};

		expect(result).toStrictEqual(expectedResult);
	});

	it('should build valid file request infos for lesson over shorthand lesson', () => {
		const schoolId = '123';
		const parentType = FileRecordParentType.Lesson;
		const lesson = lessonFactory.buildWithId();

		const result = FileParamBuilder.build(schoolId, lesson, StorageLocation.SCHOOL);

		const expectedResult = {
			storageLocationId: schoolId,
			storageLocation: StorageLocation.SCHOOL,
			parentType,
			parentId: lesson.id,
		};

		expect(result).toStrictEqual(expectedResult);
	});
});
