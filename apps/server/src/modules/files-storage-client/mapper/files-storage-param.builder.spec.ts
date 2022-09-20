import { MikroORM } from '@mikro-orm/core';
import { lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import { FileRecordParamsParentTypeEnum } from '../filesStorageApi/v3';
import { FileParamBuilder } from './files-storage-param.builder';

describe('FileParamBuilder', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	it('Should throw for not supported parent type', () => {
		const jwt = 'jwt';
		const schoolId = '123';
		const parentType = 'abc';
		const parentId = '123';

		// @ts-expect-error: Test case
		expect(() => FileParamBuilder.build(jwt, schoolId, parentType, parentId)).toThrowError();
	});

	it('should build valid file request infos for task over shorthand task', () => {
		const jwt = 'jwt';
		const schoolId = '123';
		const parentType = FileRecordParamsParentTypeEnum.Tasks;
		const task = taskFactory.buildWithId();

		const result = FileParamBuilder.build(jwt, schoolId, task);

		const expectedResult = {
			jwt,
			schoolId,
			parentType,
			parentId: task.id,
		};

		expect(result).toStrictEqual(expectedResult);
	});

	it('should build valid file request infos for lesson over shorthand lesson', () => {
		const jwt = 'jwt';
		const schoolId = '123';
		const parentType = FileRecordParamsParentTypeEnum.Lessons;
		const lesson = lessonFactory.buildWithId();

		const result = FileParamBuilder.build(jwt, schoolId, lesson);

		const expectedResult = {
			jwt,
			schoolId,
			parentType,
			parentId: lesson.id,
		};

		expect(result).toStrictEqual(expectedResult);
	});
});
