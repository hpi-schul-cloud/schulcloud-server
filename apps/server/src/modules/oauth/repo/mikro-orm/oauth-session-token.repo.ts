import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { SortOrder, SortOrderMap } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
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

	public async findLatestByUserId(userId: EntityId): Promise<OauthSessionToken | null> {
		const sortByLatestExpiresAt: SortOrderMap<OauthSessionTokenEntity> = { expiresAt: SortOrder.desc };

		const sessionTokenEntity: OauthSessionTokenEntity | null = await this.em.findOne(
			this.entityName,
			{ user: userId },
			{ orderBy: sortByLatestExpiresAt }
		);

		if (!sessionTokenEntity) {
			return null;
		}

		const sessionToken: OauthSessionToken = OauthSessionTokenEntityMapper.mapEntityToDo(sessionTokenEntity);

		return sessionToken;
	}
}
