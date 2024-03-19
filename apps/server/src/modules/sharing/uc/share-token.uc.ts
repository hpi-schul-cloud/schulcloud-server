import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AuthorizableReferenceType, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { AuthorizationReferenceService } from '@modules/authorization/domain';
import { CopyStatus } from '@modules/copy-helper';
import { CourseCopyService, CourseService } from '@modules/learnroom';
import { LessonCopyService } from '@modules/lesson';
import { TaskCopyService } from '@modules/task';
import { BadRequestException, Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { ColumnBoardCopyService } from '@modules/board';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
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
		private readonly authorizationReferenceService: AuthorizationReferenceService,
		private readonly courseCopyService: CourseCopyService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly courseService: CourseService,
		private readonly taskCopyService: TaskCopyService,
		private readonly columnBoardCopyService: ColumnBoardCopyService,
		private readonly logger: LegacyLogger
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

		await this.checkCreatePermission(userId, payload);

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

		await this.checkLookupPermission(userId, shareToken.payload.parentType);

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

		await this.checkImportPermission(userId, shareToken.payload.parentType, destinationCourseId);

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
			case ShareTokenParentType.Task:
				if (destinationCourseId === undefined) {
					throw new BadRequestException('Destination course id is required to copy task');
				}
				result = await this.copyTask(userId, shareToken.payload.parentId, destinationCourseId, newName);
				break;
			case ShareTokenParentType.ColumnBoard:
				if (destinationCourseId === undefined) {
					throw new BadRequestException('Destination course id is required to copy task');
				}
				result = await this.copyColumnBoard(userId, shareToken.payload.parentId, destinationCourseId);
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

	private async copyTask(
		userId: string,
		originalTaskId: string,
		courseId: string,
		copyName?: string
	): Promise<CopyStatus> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const destinationCourse = await this.courseService.findById(courseId);
		return this.taskCopyService.copyTask({
			user,
			originalTaskId,
			destinationCourse,
			copyName,
		});
	}

	private copyColumnBoard(userId: string, originalColumnBoardId: string, courseId: string): Promise<CopyStatus> {
		const copyCopyStatus = this.columnBoardCopyService.copyColumnBoard({
			originalColumnBoardId,
			destinationExternalReference: { type: BoardExternalReferenceType.Course, id: courseId },
			userId,
			// copyName // TODO: implement copyName once it's supported
		});
		return copyCopyStatus;
	}

	private async checkCreatePermission(userId: EntityId, payload: ShareTokenPayload) {
		const allowedParentType = ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType(payload.parentType);

		let requiredPermissions: Permission[] = [];
		// eslint-disable-next-line default-case
		switch (payload.parentType) {
			case ShareTokenParentType.Course:
				requiredPermissions = [Permission.COURSE_CREATE];
				break;
			case ShareTokenParentType.Lesson:
				requiredPermissions = [Permission.TOPIC_CREATE];
				break;
			case ShareTokenParentType.Task:
				requiredPermissions = [Permission.HOMEWORK_CREATE];
				break;
			case ShareTokenParentType.ColumnBoard:
				requiredPermissions = [Permission.COURSE_EDIT];
				break;
		}

		const authorizationContext = AuthorizationContextBuilder.write(requiredPermissions);

		await this.authorizationReferenceService.checkPermissionByReferences(
			userId,
			allowedParentType,
			payload.parentId,
			authorizationContext
		);
	}

	private async checkContextReadPermission(userId: EntityId, context: ShareTokenContext) {
		const allowedContextType = ShareTokenContextTypeMapper.mapToAllowedAuthorizationEntityType(context.contextType);
		const authorizationContext = AuthorizationContextBuilder.read([]);

		await this.authorizationReferenceService.checkPermissionByReferences(
			userId,
			allowedContextType,
			context.contextId,
			authorizationContext
		);
	}

	private async checkLookupPermission(userId: EntityId, parentType: ShareTokenParentType) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const requiredPermissions = this.getCreatePermissionForParentType(parentType);
		this.authorizationService.checkAllPermissions(user, requiredPermissions);
	}

	private async checkImportPermission(
		userId: EntityId,
		parentType: ShareTokenParentType,
		destinationCourseId?: EntityId
	) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const requiredPermissions = this.getCreatePermissionForParentType(parentType);

		if (parentType === ShareTokenParentType.Course) {
			this.authorizationService.checkAllPermissions(user, requiredPermissions);
		} else {
			if (!destinationCourseId) {
				throw new BadRequestException('Destination course id is required');
			}
			await this.authorizationReferenceService.checkPermissionByReferences(
				userId,
				AuthorizableReferenceType.Course,
				destinationCourseId,
				AuthorizationContextBuilder.write(requiredPermissions)
			);
		}
	}

	private getCreatePermissionForParentType(parentType: ShareTokenParentType): Permission[] {
		switch (parentType) {
			case ShareTokenParentType.Course:
				return [Permission.COURSE_CREATE];
			case ShareTokenParentType.Lesson:
				return [Permission.TOPIC_CREATE];
			case ShareTokenParentType.Task:
				return [Permission.HOMEWORK_CREATE];
			case ShareTokenParentType.ColumnBoard:
				return [Permission.COURSE_EDIT];
			default:
				throw new NotImplementedException('Import Feature not implemented');
		}
	}

	private nowPlusDays(days: number) {
		const date = new Date();
		date.setDate(date.getDate() + days);
		return date;
	}

	private checkFeatureEnabled(parentType: ShareTokenParentType) {
		switch (parentType) {
			case ShareTokenParentType.Course:
				// Configuration.get is the deprecated way to read envirment variables
				if (!(Configuration.get('FEATURE_COURSE_SHARE') as boolean)) {
					throw new InternalServerErrorException('Import Course Feature not enabled');
				}
				break;
			case ShareTokenParentType.Lesson:
				// Configuration.get is the deprecated way to read envirment variables
				if (!(Configuration.get('FEATURE_LESSON_SHARE') as boolean)) {
					throw new InternalServerErrorException('Import Lesson Feature not enabled');
				}
				break;
			case ShareTokenParentType.Task:
				// Configuration.get is the deprecated way to read envirment variables
				if (!(Configuration.get('FEATURE_TASK_SHARE') as boolean)) {
					throw new InternalServerErrorException('Import Task Feature not enabled');
				}
				break;
			case ShareTokenParentType.ColumnBoard:
				// Configuration.get is the deprecated way to read envirment variables
				if (!(Configuration.get('FEATURE_COLUMNBOARD_SHARE') as boolean)) {
					throw new InternalServerErrorException('Import Task Feature not enabled');
				}
				break;
			default:
				throw new NotImplementedException('Import Feature not implemented');
		}
	}
}
