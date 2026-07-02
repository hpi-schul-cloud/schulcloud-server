import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { CopyFileDto } from '../dto';
import { CopyFileDomainObjectProps } from '../interfaces';

export const copyFileDtoFactory = BaseFactory.define<CopyFileDto, CopyFileDomainObjectProps>(
	CopyFileDto,
	({ sequence }) => {
		return {
			name: `bild-${sequence}.jpg`,
			id: new ObjectId().toHexString(),
			sourceId: new ObjectId().toHexString(),
		};
	}
);
