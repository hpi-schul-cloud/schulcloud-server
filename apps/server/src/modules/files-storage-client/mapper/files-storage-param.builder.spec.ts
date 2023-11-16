import { FileRecordParentType } from '@infra/rabbitmq';
import { lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import { FileParamBuilder } from './files-storage-param.builder';

describe('FileParamBuilder', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	it('Should throw for not supported parent type', () => {
		const schoolId = '123';
		const parentType = 'abc';
		const parentId = '123';

		// @ts-expect-error: Test case
		expect(() => FileParamBuilder.build(schoolId, parentType, parentId)).toThrowError();
	});

	it('should build valid file request infos for task over shorthand task', () => {
		const schoolId = '123';
		const parentType = FileRecordParentType.Task;
		const task = taskFactory.buildWithId();

		const result = FileParamBuilder.build(schoolId, task);

		const expectedResult = {
			schoolId,
			parentType,
			parentId: task.id,
		};

		expect(result).toStrictEqual(expectedResult);
	});

	it('should build valid file request infos for lesson over shorthand lesson', () => {
		const schoolId = '123';
		const parentType = FileRecordParentType.Lesson;
		const lesson = lessonFactory.buildWithId();

		const result = FileParamBuilder.build(schoolId, lesson);

		const expectedResult = {
			schoolId,
			parentType,
			parentId: lesson.id,
		};

		expect(result).toStrictEqual(expectedResult);
	});
});
