import { StorageLocation } from '@infra/files-storage-client';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { Submission, Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { User } from '@modules/user/repo';
import { setupEntities } from '@testing/database';
import { FileRecordParentType } from '../interfaces';
import { FileParamBuilder } from './files-storage-param.builder';

describe('FileParamBuilder', () => {
	beforeAll(async () => {
		await setupEntities([User, Task, Submission, LessonEntity, Material, CourseEntity, CourseGroupEntity]);
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
