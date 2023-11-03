import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { RocketChatUserEntity, RocketChatUserEntityProps } from '../rocket-chat-user.entity';

export const rocketChatUserEntityFactory = BaseFactory.define<RocketChatUserEntity, RocketChatUserEntityProps>(
	RocketChatUserEntity,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			userId: new ObjectId().toHexString(),
			username: `username-${sequence}`,
			rcId: `rcId-${sequence}`,
			authToken: `aythToken-${sequence}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
