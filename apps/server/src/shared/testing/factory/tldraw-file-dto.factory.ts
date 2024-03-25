import { BaseFactory } from '@shared/testing';
import { FileRecordParentType } from '@infra/rabbitmq';
import { FileDto } from '@modules/files-storage-client';
import { FileDomainObjectProps } from '@modules/files-storage-client/interfaces';

export const tldrawFileDtoFactory = BaseFactory.define<FileDto, FileDomainObjectProps>(FileDto, ({ sequence }) => {
	return {
		id: `filerecordid-${sequence}`,
		parentId: 'docname',
		name: 'file',
		parentType: FileRecordParentType.BoardNode,
		createdAt: new Date(2020, 1, 1, 0, 0),
	};
});
