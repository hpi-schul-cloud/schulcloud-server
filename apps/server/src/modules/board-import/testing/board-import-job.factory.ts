import { ObjectId } from '@mikro-orm/mongodb';
import { DomainObjectFactory } from '@testing/factory/domainobject';
import {
	BoardImportJob,
	type BoardImportJobProps,
	BoardImportJobStatus,
	BoardImportSourceType,
	BoardImportTargetType,
} from '../domain';

export const boardImportJobFactory = DomainObjectFactory.define<BoardImportJob, BoardImportJobProps>(
	BoardImportJob,
	({ sequence }) => {
		const props: BoardImportJobProps = {
			id: new ObjectId().toHexString(),
			status: BoardImportJobStatus.WAITING,
			userId: new ObjectId().toHexString(),
			source: { type: BoardImportSourceType.TASKCARDS, link: `https://www.taskcards.de/#/board/${sequence}` },
			target: { type: BoardImportTargetType.ROOM, id: new ObjectId().toHexString() },
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
			attempts: 0,
		};

		return props;
	}
);
