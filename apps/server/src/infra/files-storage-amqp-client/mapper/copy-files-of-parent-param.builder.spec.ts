import { ObjectId } from '@mikro-orm/mongodb';
import { FileRecordParentType } from '../interfaces';
import { fileRequestInfoFactory } from '../testing';
import { CopyFilesOfParentParamBuilder } from './copy-files-of-parent-param.builder';

describe('CopyFilesOfParentParamBuilder', () => {
	it('should build valid file request infos for task', () => {
		const userId = new ObjectId().toHexString();
		const source = fileRequestInfoFactory.build({ parentType: FileRecordParentType.Task });
		const target = fileRequestInfoFactory.build({ parentType: FileRecordParentType.Task });

		const result = CopyFilesOfParentParamBuilder.build(userId, source, target);

		expect(result).toStrictEqual({ userId, source, target });
	});

	it('should build valid copy file request infos for lesson', () => {
		const userId = new ObjectId().toHexString();
		const source = fileRequestInfoFactory.build({ parentType: FileRecordParentType.Lesson });
		const target = fileRequestInfoFactory.build({ parentType: FileRecordParentType.Lesson });

		const result = CopyFilesOfParentParamBuilder.build(userId, source, target);

		expect(result).toStrictEqual({ userId, source, target });
	});
});
