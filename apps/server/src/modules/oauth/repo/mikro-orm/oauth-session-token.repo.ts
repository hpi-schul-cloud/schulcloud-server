import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
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
}
