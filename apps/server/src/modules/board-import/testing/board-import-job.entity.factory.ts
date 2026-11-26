import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { BoardImportJobStatus, BoardImportSourceType, BoardImportTargetType } from '../domain';
import { BoardImportJobEntity, type BoardImportJobEntityProps } from '../repo/entity';

export const boardImportJobEntityFactory = BaseFactory.define<BoardImportJobEntity, BoardImportJobEntityProps>(
	BoardImportJobEntity,
	({ sequence }) => {
		const props: BoardImportJobEntityProps = {
			id: new ObjectId().toHexString(),
			status: BoardImportJobStatus.WAITING,
			userId: new ObjectId(),
			link: `https://www.taskcards.de/#/board/${sequence}`,
			sourceType: BoardImportSourceType.TASKCARDS,
			targetType: BoardImportTargetType.ROOM,
			targetId: new ObjectId(),
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
			attempts: 0,
		};

		return props;
	}
);
