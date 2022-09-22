import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import {
	IShareTokenProperties,
	ShareToken,
	ShareTokenContext,
	ShareTokenDO,
	ShareTokenPayload,
	ShareTokenString,
} from '@shared/domain';
import { BaseDORepo } from '../base.do.repo';

@Injectable()
export class ShareTokenRepo extends BaseDORepo<ShareTokenDO, ShareToken, IShareTokenProperties> {
	get entityName(): EntityName<ShareToken> {
		return ShareToken;
	}

	getConstructor() {
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
			token: entity.token,
			payload,
			context,
			expiresAt: entity.expiresAt,
		});

		return domainObject;
	}

	protected mapDOToEntity(domainObject: ShareTokenDO): ShareToken {
		const entity = new ShareToken({
			token: domainObject.token,
			parentType: domainObject.payload.parentType,
			parentId: domainObject.payload.parentId,
			contextType: domainObject.context?.contextType,
			contextId: domainObject.context?.contextId,
			expiresAt: domainObject.expiresAt,
		});

		return entity;
	}
}
