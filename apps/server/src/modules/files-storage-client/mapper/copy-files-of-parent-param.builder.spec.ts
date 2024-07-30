import { FileRecordParentType } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { StorageLocation } from '@modules/files-storage/interface';
import { lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import { CopyFilesOfParentParamBuilder } from './copy-files-of-parent-param.builder';
import { FileParamBuilder } from './files-storage-param.builder';

describe('CopyFilesOfParentParamBuilder', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	it('should build valid file request infos for task over shorthand task', () => {
		const userId = new ObjectId().toHexString();
		const sourceEntity = taskFactory.buildWithId({});
		const targetEntity = taskFactory.buildWithId();

		const source = FileParamBuilder.build(sourceEntity.getSchoolId(), sourceEntity, StorageLocation.SCHOOL);
		const target = FileParamBuilder.build(targetEntity.getSchoolId(), targetEntity, StorageLocation.SCHOOL);

		const result = CopyFilesOfParentParamBuilder.build(userId, source, target);

		const expectedResult = {
			userId,
			source: {
				parentType: FileRecordParentType.Task,
				parentId: sourceEntity.id,
				storageLocationId: sourceEntity.getSchoolId(),
				storageLocation: StorageLocation.SCHOOL,
			},
			target: {
				parentType: FileRecordParentType.Task,
				parentId: targetEntity.id,
				storageLocationId: targetEntity.getSchoolId(),
				storageLocation: StorageLocation.SCHOOL,
			},
		};

		expect(result).toStrictEqual(expectedResult);
	});

	it('should build valid copy file request infos for lesson over shorthand lesson', () => {
		const userId = new ObjectId().toHexString();
		const sourceEntity = lessonFactory.buildWithId({});
		const targetEntity = lessonFactory.buildWithId();

		const source = FileParamBuilder.build(sourceEntity.getSchoolId(), sourceEntity, StorageLocation.SCHOOL);
		const target = FileParamBuilder.build(targetEntity.getSchoolId(), targetEntity, StorageLocation.SCHOOL);

		const result = CopyFilesOfParentParamBuilder.build(userId, source, target);

		const expectedResult = {
			userId,
			source: {
				parentType: FileRecordParentType.Lesson,
				parentId: sourceEntity.id,
				storageLocationId: sourceEntity.getSchoolId(),
				storageLocation: StorageLocation.SCHOOL,
			},
			target: {
				parentType: FileRecordParentType.Lesson,
				parentId: targetEntity.id,
				storageLocationId: targetEntity.getSchoolId(),
				storageLocation: StorageLocation.SCHOOL,
			},
		};

		expect(result).toStrictEqual(expectedResult);
	});
});
