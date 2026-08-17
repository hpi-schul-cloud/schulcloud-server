import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { randomInt } from 'node:crypto';
import { FileDo, type FileProps } from '../domain/do/file';

export const fileDomainFactory: BaseFactory<FileDo, FileProps> = BaseFactory.define<FileDo, FileProps>(
	FileDo,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			name: `test-file-${sequence}.txt`,
			isDirectory: false,
			storageFileName: `00${sequence}-test-file-${sequence}.txt`,
			bucket: `bucket-00${sequence}`,
			storageProviderId: new ObjectId().toHexString(),
			parentId: undefined,
			size: 1000 + sequence * randomInt(0, 1024),
		};
	}
);
