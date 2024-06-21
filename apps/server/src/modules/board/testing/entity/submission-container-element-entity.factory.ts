import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';
import { BoardNodeType, ROOT_PATH, SubmissionContainerElementProps } from '../../domain';

export const submissionContainerElementEntityFactory = BoardNodeEntityFactory.define<
	PropsWithType<SubmissionContainerElementProps>
>(() => {
	const inThreeDays = new Date(Date.now() + 259200000);

	return {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		dueDate: inThreeDays,
		createdAt: new Date(),
		updatedAt: new Date(),
		type: BoardNodeType.SUBMISSION_CONTAINER_ELEMENT,
	};
});
