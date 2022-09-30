import { Injectable, NotImplementedException } from '@nestjs/common';
import { Actions, EntityId, Permission, ShareTokenContext, ShareTokenDO, ShareTokenPayload } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { ShareTokenContextTypeMapper } from '../mapper/context-type.mapper';
import { ShareTokenParentTypeMapper } from '../mapper/parent-type.mapper';
import { ShareTokenService } from '../share-token.service';

@Injectable()
export class ShareTokenUC {
	constructor(
		private readonly shareTokenService: ShareTokenService,
		private readonly authorizationService: AuthorizationService
	) {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	lookupShareToken(userId: EntityId, token: string): Promise<ShareTokenDO> {
		return Promise.reject(new NotImplementedException());
	}

	async createShareToken(
		userId: EntityId,
		payload: ShareTokenPayload,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: { context?: ShareTokenContext; expiresAt?: Date }
	): Promise<ShareTokenDO> {
		await this.checkParentWritePermission(userId, payload);
		if (options?.context) {
			await this.checkContextReadPermission(userId, options?.context);
		}

		const shareToken = await this.shareTokenService.createToken(payload, options);
		return shareToken;
	}

	private async checkParentWritePermission(userId: EntityId, payload: ShareTokenPayload) {
		const allowedParentType = ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType(payload.parentType);
		await this.authorizationService.checkPermissionByReferences(userId, allowedParentType, payload.parentId, {
			action: Actions.write,
			requiredPermissions: [Permission.COURSE_CREATE],
		});
	}

	private async checkContextReadPermission(userId: EntityId, context: ShareTokenContext) {
		const allowedContextType = ShareTokenContextTypeMapper.mapToAllowedAuthorizationEntityType(context.contextType);
		await this.authorizationService.checkPermissionByReferences(userId, allowedContextType, context.contextId, {
			action: Actions.read,
			requiredPermissions: [],
		});
	}
}
