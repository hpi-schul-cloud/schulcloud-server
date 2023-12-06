import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseDORepo } from '@shared/repo/base.do.repo';
import { ShareTokenContext, ShareTokenDO, ShareTokenPayload, ShareTokenString } from '../domainobject/share-token.do';
import { ShareToken } from '../entity/share-token.entity';

@Injectable()
export class ShareTokenRepo extends BaseDORepo<ShareTokenDO, ShareToken> {
	get entityName(): EntityName<ShareToken> {
		return ShareToken;
	}

	async findOneByToken(token: ShareTokenString): Promise<ShareTokenDO> {
		const entity = await this._em.findOneOrFail(ShareToken, { token });

		const shareToken = this.mapEntityToDO(entity);

		return shareToken;
	}

	protected mapEntityToDO(entity: ShareToken): ShareTokenDO {
		const payload: ShareTokenPayload = {
			parentType: entity.parentType,
			parentId: entity.parentId,
		};

		const context: ShareTokenContext | undefined =
			entity.contextType && entity.contextId
				? { contextType: entity.contextType, contextId: entity.contextId }
				: undefined;

		const domainObject = new ShareTokenDO({
			id: entity.id,
			token: entity.token,
			payload,
			context,
			expiresAt: entity.expiresAt,
		});

		return domainObject;
	}

	protected mapDOToEntityProperties(domainObject: ShareTokenDO): EntityData<ShareToken> {
		const properties = {
			token: domainObject.token,
			parentType: domainObject.payload.parentType,
			parentId: domainObject.payload.parentId,
			contextType: domainObject.context?.contextType,
			contextId: domainObject.context?.contextId,
			expiresAt: domainObject.expiresAt,
		};

		return properties;
	}
}
