import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';
import { BoardNodeType, ROOT_PATH, VideoConferenceElementProps } from '../../domain';

export const videoConferenceElementEntityFactory = BoardNodeEntityFactory.define<
	PropsWithType<VideoConferenceElementProps>
>(({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		title: `video conference element #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		type: BoardNodeType.VIDEO_CONFERENCE_ELEMENT,
	};
});
