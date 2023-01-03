import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseDORepo, EntityProperties } from '@shared/repo/base.do.repo';
import { ShareTokenContext, ShareTokenDO, ShareTokenPayload, ShareTokenString } from '../domainobject/share-token.do';
import { IShareTokenProperties, ShareToken } from '../entity/share-token.entity';

@Injectable()
export class ShareTokenRepo extends BaseDORepo<ShareTokenDO, ShareToken, IShareTokenProperties> {
	get entityName(): EntityName<ShareToken> {
		return ShareToken;
	}

	entityFactory(props: IShareTokenProperties): ShareToken {
		return new ShareToken(props);
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
			token: entity.token,
			payload,
			context,
			expiresAt: entity.expiresAt,
		});

		return domainObject;
	}

	protected mapDOToEntityProperties(domainObject: ShareTokenDO): EntityProperties<IShareTokenProperties> {
		const properties: EntityProperties<IShareTokenProperties> = {
			id: domainObject.id,
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
