import { EntityFactory } from '@testing/factory/entity.factory';
import { v4 as uuid } from 'uuid';
import { FileRecordSecurityCheckProps, ScanStatus } from '../domain';
import { FileRecordSecurityCheckEmbeddable } from '../repo/file-record.entity';

export const fileRecordSecurityCheckEmbeddableFactory = EntityFactory.define<
	FileRecordSecurityCheckEmbeddable,
	FileRecordSecurityCheckProps
>(FileRecordSecurityCheckEmbeddable, () => {
	const embeddable: FileRecordSecurityCheckEmbeddable = {
		status: ScanStatus.PENDING,
		reason: `not yet scanned`,
		requestToken: uuid(),
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	return embeddable;
});
