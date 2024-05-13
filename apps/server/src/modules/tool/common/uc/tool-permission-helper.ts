import { AuthorizationContext, AuthorizationService, ForbiddenLoggableException } from '@modules/authorization';
import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { BoardDoAuthorizableService, ContentElementService } from '@modules/board';
import { CourseService } from '@modules/learnroom';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BoardDoAuthorizable } from '@shared/domain/domainobject';
import { Course, User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ToolContextType } from '../enum';

@Injectable()
export class ToolPermissionHelper {
	constructor(
		@Inject(forwardRef(() => AuthorizationService)) private readonly authorizationService: AuthorizationService,
		private readonly courseService: CourseService,
		private readonly boardElementService: ContentElementService,
		private readonly boardService: BoardDoAuthorizableService
	) {}

	public async ensureContextPermissionsForSchool(
		user: User,
		schoolExternalTool: SchoolExternalTool,
		contextId: EntityId,
		contextType: ToolContextType,
		context: AuthorizationContext
	): Promise<void> {
		this.authorizationService.checkPermission(user, schoolExternalTool, context);

		await this.checkPermissionsByContextRef(user, contextId, contextType, context);
	}

	public async ensureContextPermissions(
		user: User,
		contextExternalTool: ContextExternalTool,
		context: AuthorizationContext
	): Promise<void> {
		this.authorizationService.checkPermission(user, contextExternalTool, context);

		await this.checkPermissionsByContextRef(
			user,
			contextExternalTool.contextRef.id,
			contextExternalTool.contextRef.type,
			context
		);
	}

	private async checkPermissionsByContextRef(
		user: User,
		contextId: EntityId,
		contextType: ToolContextType,
		context: AuthorizationContext
	): Promise<void> {
		switch (contextType) {
			case ToolContextType.COURSE: {
				const course: Course = await this.courseService.findById(contextId);

				this.authorizationService.checkPermission(user, course, context);
				break;
			}
			case ToolContextType.BOARD_ELEMENT: {
				const boardElement = await this.boardElementService.findById(contextId);
				const board: BoardDoAuthorizable = await this.boardService.getBoardAuthorizable(boardElement);

				this.authorizationService.checkPermission(user, board, context);
				break;
			}
			case ToolContextType.MEDIA_BOARD: {
				const board: BoardDoAuthorizable = await this.boardService.findById(contextId);

				this.authorizationService.checkPermission(user, board, context);
				break;
			}
			default: {
				throw new ForbiddenLoggableException(user.id, AuthorizableReferenceType.ContextExternalToolEntity, context);
			}
		}
	}
}
