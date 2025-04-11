import { BaseFactory } from '@testing/factory/base.factory';
import { v4 as uuid } from 'uuid';
import { ScanStatus } from '../domain';
import { FileRecordSecurityCheckEmbeddable } from '../repo/file-record.entity';

export const fileRecordSecurityCheckEmbeddableFactory = BaseFactory.define<
	FileRecordSecurityCheckEmbeddable,
	FileRecordSecurityCheckEmbeddable
>(FileRecordSecurityCheckEmbeddable, ({ sequence }) => {
	const embeddable: FileRecordSecurityCheckEmbeddable = {
		status: ScanStatus.PENDING,
		reason: `reason #${sequence}`,
		requestToken: uuid(),
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	return embeddable;
});
