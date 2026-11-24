import { ObjectId } from '@mikro-orm/mongodb';
import { DomainObjectFactory } from '@testing/factory/domainobject';
import { BoardImportJob, type BoardImportJobProps, BoardImportJobStatus } from '../domain';

export const boardImportJobFactory = DomainObjectFactory.define<BoardImportJob, BoardImportJobProps>(
	BoardImportJob,
	({ sequence }) => {
		const props: BoardImportJobProps = {
			id: new ObjectId().toHexString(),
			status: BoardImportJobStatus.WAITING,
			userId: new ObjectId().toHexString(),
			link: `https://example.com/board-${sequence}`,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		};

		return props;
	}
);
