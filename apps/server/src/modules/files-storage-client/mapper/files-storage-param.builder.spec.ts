import { FileRecordParentType } from '@infra/rabbitmq';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { StorageLocation } from '@modules/files-storage/interface';
import { LessonEntity } from '@modules/lesson/repository';
import { lessonFactory } from '@modules/lesson/testing';
import { Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { User } from '@modules/user/repo';
import { Material, Submission } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
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
