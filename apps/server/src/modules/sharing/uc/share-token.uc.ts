import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { BadRequestException, Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { Actions, EntityId, Permission } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { CopyStatus } from '@src/modules/copy-helper';
import { CourseCopyService } from '@src/modules/learnroom';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { LessonCopyService } from '@src/modules/lesson/service';
import {
	ShareTokenContext,
	ShareTokenContextType,
	ShareTokenDO,
	ShareTokenParentType,
	ShareTokenPayload,
} from '../domainobject/share-token.do';
import { ShareTokenContextTypeMapper, ShareTokenParentTypeMapper } from '../mapper';
import { ShareTokenService } from '../service';
import { ShareTokenInfoDto } from './dto';

@Injectable()
export class ShareTokenUC {
	constructor(
		private readonly shareTokenService: ShareTokenService,
		private readonly authorizationService: AuthorizationService,
		private readonly courseCopyService: CourseCopyService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly courseService: CourseService,

		private readonly logger: Logger
	) {
		this.logger.setContext(ShareTokenUC.name);
	}

	async createShareToken(
		userId: EntityId,
		payload: ShareTokenPayload,
		options?: { schoolExclusive?: boolean; expiresInDays?: number }
	): Promise<ShareTokenDO> {
		this.checkFeatureEnabled(payload.parentType);

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
		this.logger.debug({ action: 'lookupShareToken', userId, token });

		const { shareToken, parentName } = await this.shareTokenService.lookupTokenWithParentName(token);

		this.checkFeatureEnabled(shareToken.payload.parentType);

		await this.checkCreatePermission(userId, shareToken.payload.parentType);

		if (shareToken.context) {
			await this.checkContextReadPermission(userId, shareToken.context);
		}

		const shareTokenInfo: ShareTokenInfoDto = {
			token,
			parentType: shareToken.payload.parentType,
			parentName,
		};

		return shareTokenInfo;
	}

	async importShareToken(
		userId: EntityId,
		token: string,
		newName: string,
		destinationCourseId?: string
	): Promise<CopyStatus> {
		this.logger.debug({ action: 'importShareToken', userId, token, newName });

		const shareToken = await this.shareTokenService.lookupToken(token);

		this.checkFeatureEnabled(shareToken.payload.parentType);

		if (shareToken.context) {
			await this.checkContextReadPermission(userId, shareToken.context);
		}

		await this.checkCreatePermission(userId, shareToken.payload.parentType);

		let result: CopyStatus;
		switch (shareToken.payload.parentType) {
			case ShareTokenParentType.Course:
				result = await this.copyCourse(userId, shareToken.payload.parentId, newName);
				break;
			case ShareTokenParentType.Lesson:
				if (destinationCourseId === undefined) {
					throw new BadRequestException('Destination course id is required to copy lesson');
				}
				result = await this.copyLesson(userId, shareToken.payload.parentId, destinationCourseId, newName);
				break;
			default:
				throw new NotImplementedException('Copy not implemented');
		}

		return result;
	}

	private async copyCourse(userId: EntityId, courseId: string, newName: string): Promise<CopyStatus> {
		return this.courseCopyService.copyCourse({
			userId,
			courseId,
			newName,
		});
	}

	private async copyLesson(userId: string, lessonId: string, courseId: string, copyName?: string): Promise<CopyStatus> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const destinationCourse = await this.courseService.findById(courseId);
		return this.lessonCopyService.copyLesson({
			user,
			originalLessonId: lessonId,
			destinationCourse,
			copyName,
		});
	}

	private async checkParentWritePermission(userId: EntityId, payload: ShareTokenPayload) {
		const allowedParentType = ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType(payload.parentType);

		let requiredPermissions: Permission[] = [];
		switch (payload.parentType) {
			case ShareTokenParentType.Course:
				requiredPermissions = [Permission.COURSE_CREATE];
				break;
			default:
				requiredPermissions = [Permission.TOPIC_CREATE];
				break;
		}

		await this.authorizationService.checkPermissionByReferences(userId, allowedParentType, payload.parentId, {
			action: Actions.write,
			requiredPermissions,
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

		let requiredPermissions: Permission[] = [];
		switch (parentType) {
			case ShareTokenParentType.Course:
				requiredPermissions = [Permission.COURSE_CREATE];
				break;
			default:
				requiredPermissions = [Permission.TOPIC_CREATE];
				break;
		}
		this.authorizationService.checkAllPermissions(user, requiredPermissions);
	}

	private nowPlusDays(days: number) {
		const date = new Date();
		date.setDate(date.getDate() + days);
		return date;
	}

	private checkFeatureEnabled(parentType: ShareTokenParentType) {
		switch (parentType) {
			case ShareTokenParentType.Course:
				if (!(Configuration.get('FEATURE_COURSE_SHARE_NEW') as boolean)) {
					throw new InternalServerErrorException('Import Course Feature not enabled');
				}
				break;
			case ShareTokenParentType.Lesson:
				if (!(Configuration.get('FEATURE_LESSON_SHARE') as boolean)) {
					throw new InternalServerErrorException('Import Lesson Feature not enabled');
				}
				break;
			default:
				throw new NotImplementedException('Import Feature not implemented');
		}
	}
}
