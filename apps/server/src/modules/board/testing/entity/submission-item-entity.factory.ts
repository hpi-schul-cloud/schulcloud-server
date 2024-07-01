import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';
import { BoardNodeType, ROOT_PATH, SubmissionItemProps } from '../../domain';

export const submissionItemEntityFactory = BoardNodeEntityFactory.define<PropsWithType<SubmissionItemProps>>(() => {
	return {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		completed: false,
		userId: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
		type: BoardNodeType.SUBMISSION_ITEM,
	};
});
