import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { RocketChatUserEntity } from '../entity';
import { RocketChatUser } from '../domain/rocket-chat-user.do';
import { RocketChatUserMapper } from './mapper';

@Injectable()
export class RocketChatUserRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName() {
		return RocketChatUserEntity;
	}

	async findByUserId(id: EntityId): Promise<RocketChatUser> {
		const entity: RocketChatUserEntity = await this.em.findOneOrFail(RocketChatUserEntity, {
			userId: id,
		});

		const mapped: RocketChatUser = RocketChatUserMapper.mapToDO(entity);

		return mapped;
	}

	async deleteByUserId(id: EntityId): Promise<boolean> {
		const entity: RocketChatUserEntity | null = await this.em.findOne(RocketChatUserEntity, {
			userId: id,
		});

		if (!entity) {
			return false;
		}

		await this.em.removeAndFlush(entity);

		return true;
	}
}
