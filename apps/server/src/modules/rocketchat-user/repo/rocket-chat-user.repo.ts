import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RocketChatUser } from '../domain/rocket-chat-user.do';
import { RocketChatUserEntity } from '../entity';
import { RocketChatUserMapper } from './mapper';

@Injectable()
export class RocketChatUserRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName() {
		return RocketChatUserEntity;
	}

	async findByUserId(userId: EntityId): Promise<RocketChatUser> {
		const entity: RocketChatUserEntity = await this.em.findOneOrFail(RocketChatUserEntity, {
			userId: new ObjectId(userId),
		});

		const mapped: RocketChatUser = RocketChatUserMapper.mapToDO(entity);

		return mapped;
	}

	async deleteByUserId(userId: EntityId): Promise<number> {
		const promise: Promise<number> = this.em.nativeDelete(RocketChatUserEntity, {
			userId: new ObjectId(userId),
		});

		return promise;
	}
}
