import { ObjectId } from '@mikro-orm/mongodb';
import { RocketChatUserEntity } from '../../entity';
import { RocketChatUser } from '../../domain/rocket-chat-user.do';

export class RocketChatUserMapper {
	static mapToDO(entity: RocketChatUserEntity): RocketChatUser {
		return new RocketChatUser({
			id: entity.id,
			userId: entity.userId.toHexString(),
			username: entity.username,
			rcId: entity.rcId,
			authToken: entity.authToken,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
	}

	static mapToEntity(domainObject: RocketChatUser): RocketChatUserEntity {
		return new RocketChatUserEntity({
			id: domainObject.id,
			userId: new ObjectId(domainObject.userId),
			username: domainObject.username,
			rcId: domainObject.rcId,
			authToken: domainObject.authToken,
			createdAt: domainObject.createdAt,
			updatedAt: domainObject.updatedAt,
		});
	}

	static mapToDOs(entities: RocketChatUserEntity[]): RocketChatUser[] {
		return entities.map((entity) => this.mapToDO(entity));
	}
}
