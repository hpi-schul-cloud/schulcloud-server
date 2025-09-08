import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { ROOT_PATH, VideoConferenceElement, VideoConferenceElementProps } from '../domain';

export const videoConferenceElementFactory = BaseFactory.define<VideoConferenceElement, VideoConferenceElementProps>(
	VideoConferenceElement,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			title: `video conference element #${sequence}`,
		};
	}
);
