import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { BoardImportJobStatus } from '../domain';
import { BoardImportJobEntity, type BoardImportJobEntityProps } from '../repo/entity';

export const boardImportJobEntityFactory = BaseFactory.define<BoardImportJobEntity, BoardImportJobEntityProps>(
	BoardImportJobEntity,
	({ sequence }) => {
		const props: BoardImportJobEntityProps = {
			id: new ObjectId().toHexString(),
			status: BoardImportJobStatus.WAITING,
			userId: new ObjectId(),
			link: `https://example.com/board-${sequence}`,
		};

		return props;
	}
);
