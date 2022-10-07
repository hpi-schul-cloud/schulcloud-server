import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { FileRecordParentType } from '@shared/domain';
import { lessonFactory, schoolFactory, setupEntities, taskFactory } from '@shared/testing';
import { CopyFilesOfParentParamBuilder } from './copy-files-of-parent-param.builder';

describe('CopyFilesOfParentParamBuilder', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	it('should throw for not supported parent type', () => {
		const userId = new ObjectId().toHexString();
		const source = taskFactory.buildWithId();
		const target = schoolFactory.buildWithId();

		// @ts-expect-error: Test case
		expect(() => CopyFilesOfParentParamBuilder.build(userId, source, target)).toThrowError();
	});

	it('should build valid file request infos for task over shorthand task', () => {
		const userId = new ObjectId().toHexString();
		const source = taskFactory.buildWithId();
		const target = taskFactory.buildWithId();

		const result = CopyFilesOfParentParamBuilder.build(userId, source, target);

		const expectedResult = {
			userId,
			source: {
				parentType: FileRecordParentType.Task,
				schoolId: source.getSchoolId(),
				parentId: source.id,
			},
			target: {
				parentType: FileRecordParentType.Task,
				schoolId: target.getSchoolId(),
				parentId: target.id,
			},
		};

		expect(result).toStrictEqual(expectedResult);
	});

	it('should build valid copy file request infos for lesson over shorthand lesson', () => {
		const userId = new ObjectId().toHexString();
		const source = lessonFactory.buildWithId();
		const target = lessonFactory.buildWithId();

		const result = CopyFilesOfParentParamBuilder.build(userId, source, target);

		const expectedResult = {
			userId,
			source: {
				parentType: FileRecordParentType.Lesson,
				schoolId: source.getSchoolId(),
				parentId: source.id,
			},
			target: {
				parentType: FileRecordParentType.Lesson,
				schoolId: target.getSchoolId(),
				parentId: target.id,
			},
		};

		expect(result).toStrictEqual(expectedResult);
	});
});
