import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { RocketChatUserEntity, RocketChatUserEntityProps } from '../rocket-chat-user.entity';

class RocketChatUserFactory extends BaseFactory<RocketChatUserEntity, RocketChatUserEntityProps> {}

export const rocketChatUserEntityFactory = RocketChatUserFactory.define<
	RocketChatUserEntity,
	RocketChatUserEntityProps
>(RocketChatUserEntity, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		userId: new ObjectId(),
		username: `username-${sequence}`,
		rcId: `rcId-${sequence}`,
		authToken: `aythToken-${sequence}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
