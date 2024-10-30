import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { EntityId } from '@shared/domain/types';
import { SortOrderMap } from '@shared/domain/interface';
import { OauthSessionToken } from '../../domain';
import { OauthSessionTokenEntity } from '../../entity';
import { OauthSessionTokenRepo } from '../oauth-session-token.repo.interface';
import { OauthSessionTokenEntityMapper } from './mapper';

@Injectable()
export class OauthSessionTokenMikroOrmRepo
	extends BaseDomainObjectRepo<OauthSessionToken, OauthSessionTokenEntity>
	implements OauthSessionTokenRepo
{
	protected get entityName(): EntityName<OauthSessionTokenEntity> {
		return OauthSessionTokenEntity;
	}

	protected mapDOToEntityProperties(entityDO: OauthSessionToken): EntityData<OauthSessionTokenEntity> {
		return OauthSessionTokenEntityMapper.mapDOToEntityProperties(entityDO, this.em);
	}

	public async findOneByUserId(
		userId: EntityId,
		sortOption?: SortOrderMap<OauthSessionTokenEntity>
	): Promise<OauthSessionToken | null> {
		const sessionTokenEntity: OauthSessionTokenEntity | null = await this.em.findOne(
			this.entityName,
			{ user: userId },
			{ orderBy: sortOption }
		);

		if (!sessionTokenEntity) {
			return null;
		}

		const sessionToken: OauthSessionToken = OauthSessionTokenEntityMapper.mapEntityToDo(sessionTokenEntity);

		return sessionToken;
	}
}
