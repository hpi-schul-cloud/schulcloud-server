import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { LtiDeepLinkToken } from '../../domain';
import { LtiDeepLinkTokenRepo } from '../lti-deep-link-token.repo.interface';
import { LtiDeepLinkTokenEntityMapper } from './mapper';
import { LtiDeepLinkTokenEntity } from './lti-deep-link-token.entity';

@Injectable()
export class LtiDeepLinkTokenMikroOrmRepo
	extends BaseDomainObjectRepo<LtiDeepLinkToken, LtiDeepLinkTokenEntity>
	implements LtiDeepLinkTokenRepo
{
	protected get entityName(): EntityName<LtiDeepLinkTokenEntity> {
		return LtiDeepLinkTokenEntity;
	}

	protected mapDOToEntityProperties(entityDO: LtiDeepLinkToken): EntityData<LtiDeepLinkTokenEntity> {
		return LtiDeepLinkTokenEntityMapper.mapDOToEntityProperties(entityDO, this.em);
	}

	public async findByState(state: string): Promise<LtiDeepLinkToken | null> {
		const sessionTokenEntity: LtiDeepLinkTokenEntity | null = await this.em.findOne(this.entityName, { state });

		if (!sessionTokenEntity) {
			return null;
		}

		const sessionToken: LtiDeepLinkToken = LtiDeepLinkTokenEntityMapper.mapEntityToDo(sessionTokenEntity);

		return sessionToken;
	}
}
