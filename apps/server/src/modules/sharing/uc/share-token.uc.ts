import { Injectable } from '@nestjs/common';
import {
	Actions,
	EntityId,
	Permission,
	ShareTokenContext,
	ShareTokenContextType,
	ShareTokenDO,
	ShareTokenParentType,
	ShareTokenPayload,
} from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { ShareTokenContextTypeMapper, ShareTokenParentTypeMapper } from '../mapper';
import { ParentInfoLoader } from '../parent-info.loader';
import { ShareTokenService } from '../share-token.service';

export interface ShareTokenInfo {
	parentType: ShareTokenParentType;
	parentName: string;
}

@Injectable()
export class ShareTokenUC {
	constructor(
		private readonly shareTokenService: ShareTokenService,
		private readonly authorizationService: AuthorizationService,
		private readonly parentInfoLoader: ParentInfoLoader,
		private readonly logger: Logger
	) {
		this.logger.setContext(ShareTokenUC.name);
	}

	async lookupShareToken(userId: EntityId, token: string): Promise<ShareTokenInfo> {
		const shareToken = await this.shareTokenService.lookupToken(token);

		if (shareToken.context) {
			await this.checkContextReadPermission(userId, shareToken.context);
		}

		const parentInfo = await this.parentInfoLoader.loadParentInfo(shareToken.payload);

		const shareTokenInfo: ShareTokenInfo = {
			parentType: shareToken.payload.parentType,
			parentName: parentInfo.name,
		};

		return shareTokenInfo;
	}

	async createShareToken(
		userId: EntityId,
		payload: ShareTokenPayload,
		options?: { schoolExclusive?: boolean; expiresInDays?: number }
	): Promise<ShareTokenDO> {
		this.logger.debug({ action: 'createShareToken', userId, payload, options });

		await this.checkParentWritePermission(userId, payload);

		const serviceOptions: { context?: ShareTokenContext; expiresAt?: Date } = {};
		if (options?.schoolExclusive) {
			const user = await this.authorizationService.getUserWithPermissions(userId);
			serviceOptions.context = {
				contextType: ShareTokenContextType.School,
				contextId: user.school.id,
			};
			await this.checkContextReadPermission(userId, serviceOptions.context);
		}
		if (options?.expiresInDays) {
			serviceOptions.expiresAt = this.nowPlusDays(options?.expiresInDays);
		}

		const shareToken = await this.shareTokenService.createToken(payload, serviceOptions);
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

	private nowPlusDays(days: number) {
		const date = new Date();
		date.setDate(date.getDate() + days);
		return date;
	}
}
