import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Actions, CopyStatus, EntityId, LearnroomMetadata, Permission } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { CourseCopyService } from '@src/modules/learnroom';
import { MetadataLoader } from '@src/modules/learnroom/service/metadata-loader.service';
import { ShareTokenContextTypeMapper, ShareTokenParentTypeMapper } from '../mapper';
import { MetadataTypeMapper } from '../mapper/metadata-type.mapper';
import { ShareTokenService } from '../service';
import { ShareTokenInfoDto } from './dto';
import {
	ShareTokenContext,
	ShareTokenContextType,
	ShareTokenDO,
	ShareTokenParentType,
	ShareTokenPayload,
} from '../domainobject/share-token.do';

@Injectable()
export class ShareTokenUC {
	constructor(
		private readonly shareTokenService: ShareTokenService,
		private readonly authorizationService: AuthorizationService,
		private readonly metadataLoader: MetadataLoader,
		private readonly courseCopyService: CourseCopyService,

		private readonly logger: Logger
	) {
		this.logger.setContext(ShareTokenUC.name);
	}

	async createShareToken(
		userId: EntityId,
		payload: ShareTokenPayload,
		options?: { schoolExclusive?: boolean; expiresInDays?: number }
	): Promise<ShareTokenDO> {
		this.checkFeatureEnabled();

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
			serviceOptions.expiresAt = this.nowPlusDays(options.expiresInDays);
		}

		const shareToken = await this.shareTokenService.createToken(payload, serviceOptions);
		return shareToken;
	}

	async lookupShareToken(userId: EntityId, token: string): Promise<ShareTokenInfoDto> {
		this.checkFeatureEnabled();

		this.logger.debug({ action: 'lookupShareToken', userId, token });

		const shareToken = await this.shareTokenService.lookupToken(token);

		if (shareToken.context) {
			await this.checkContextReadPermission(userId, shareToken.context);
		}

		const metadata: LearnroomMetadata = await this.loadMetadata(shareToken.payload);

		const shareTokenInfo: ShareTokenInfoDto = {
			token,
			parentType: shareToken.payload.parentType,
			parentName: metadata.title,
		};

		return shareTokenInfo;
	}

	async importShareToken(userId: EntityId, token: string, newName: string): Promise<CopyStatus> {
		this.checkFeatureEnabled();

		this.logger.debug({ action: 'importShareToken', userId, token, newName });

		const shareToken = await this.shareTokenService.lookupToken(token);

		if (shareToken.context) {
			await this.checkContextReadPermission(userId, shareToken.context);
		}

		await this.checkCreatePermission(userId, shareToken.payload.parentType);

		const result = await this.courseCopyService.copyCourse({
			userId,
			courseId: shareToken.payload.parentId,
			newName,
		});

		return result;
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

	private async checkCreatePermission(userId: EntityId, parentType: ShareTokenParentType) {
		// checks if parent type is supported
		ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType(parentType);

		const user = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkAllPermissions(user, [Permission.COURSE_CREATE]);
	}

	private async loadMetadata(payload: ShareTokenPayload): Promise<LearnroomMetadata> {
		const learnroomType = MetadataTypeMapper.mapToAlloweMetadataType(payload.parentType);
		const metadata = await this.metadataLoader.loadMetadata({
			type: learnroomType,
			id: payload.parentId,
		});

		return metadata;
	}

	private nowPlusDays(days: number) {
		const date = new Date();
		date.setDate(date.getDate() + days);
		return date;
	}

	private checkFeatureEnabled() {
		const enabled = Configuration.get('FEATURE_COURSE_SHARE_NEW') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Import Feature not enabled');
		}
	}
}
