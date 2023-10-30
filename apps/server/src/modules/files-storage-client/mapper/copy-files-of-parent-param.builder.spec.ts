import { ObjectId } from '@mikro-orm/mongodb';

describe('CopyFilesOfParentParamBuilder', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	it('should build valid file request infos for task over shorthand task', () => {
		const userId = new ObjectId().toHexString();
		const sourceEntity = taskFactory.buildWithId({});
		const targetEntity = taskFactory.buildWithId();

		const source = FileParamBuilder.build(sourceEntity.getSchoolId(), sourceEntity);
		const target = FileParamBuilder.build(targetEntity.getSchoolId(), targetEntity);

		const result = CopyFilesOfParentParamBuilder.build(userId, source, target);

		const expectedResult = {
			userId,
			source: {
				parentType: FileRecordParentType.Task,
				schoolId: sourceEntity.getSchoolId(),
				parentId: sourceEntity.id,
			},
			target: {
				parentType: FileRecordParentType.Task,
				schoolId: targetEntity.getSchoolId(),
				parentId: targetEntity.id,
			},
		};

		expect(result).toStrictEqual(expectedResult);
	});

	it('should build valid copy file request infos for lesson over shorthand lesson', () => {
		const userId = new ObjectId().toHexString();
		const sourceEntity = lessonFactory.buildWithId({});
		const targetEntity = lessonFactory.buildWithId();

		const source = FileParamBuilder.build(sourceEntity.getSchoolId(), sourceEntity);
		const target = FileParamBuilder.build(targetEntity.getSchoolId(), targetEntity);

		const result = CopyFilesOfParentParamBuilder.build(userId, source, target);

		const expectedResult = {
			userId,
			source: {
				parentType: FileRecordParentType.Lesson,
				schoolId: sourceEntity.getSchoolId(),
				parentId: sourceEntity.id,
			},
			target: {
				parentType: FileRecordParentType.Lesson,
				schoolId: targetEntity.getSchoolId(),
				parentId: targetEntity.id,
			},
		};

		expect(result).toStrictEqual(expectedResult);
	});
});
