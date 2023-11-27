import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { RocketChatUser, RocketChatUserProps } from '../rocket-chat-user.do';

export const rocketChatUserFactory = BaseFactory.define<RocketChatUser, RocketChatUserProps>(
	RocketChatUser,
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
