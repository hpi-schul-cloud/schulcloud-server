import { AuthorizationContext, AuthorizationService, ForbiddenLoggableException } from '@modules/authorization';
import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { BoardDoAuthorizableService, ContentElementService } from '@modules/board';
import { CourseService } from '@modules/learnroom';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BoardDoAuthorizable } from '@shared/domain/domainobject';
import { Course, User } from '@shared/domain/entity';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolContextType } from '../enum';

@Injectable()
export class ToolPermissionHelper {
	constructor(
		@Inject(forwardRef(() => AuthorizationService)) private readonly authorizationService: AuthorizationService,
		// invalid dependency on this place it is in UC layer in a other module
		// loading of ressources should be part of service layer
		// if it must resolve different loadings based on the request it can be added in own service and use in UC
		private readonly courseService: CourseService,
		private readonly boardElementService: ContentElementService,
		private readonly boardService: BoardDoAuthorizableService
	) {}

	// TODO build interface to get contextDO by contextType
	public async ensureContextPermissions(
		user: User,
		contextExternalTool: ContextExternalTool,
		context: AuthorizationContext
	): Promise<void> {
		this.authorizationService.checkPermission(user, contextExternalTool, context);

		if (contextExternalTool.contextRef.type === ToolContextType.COURSE) {
			// loading of ressources should be part of the UC -> unnessasary awaits
			const course: Course = await this.courseService.findById(contextExternalTool.contextRef.id);

			this.authorizationService.checkPermission(user, course, context);
		} else if (contextExternalTool.contextRef.type === ToolContextType.BOARD_ELEMENT) {
			const boardElement = await this.boardElementService.findById(contextExternalTool.contextRef.id);

			const board: BoardDoAuthorizable = await this.boardService.getBoardAuthorizable(boardElement);

			this.authorizationService.checkPermission(user, board, context);
		} else {
			throw new ForbiddenLoggableException(user.id, AuthorizableReferenceType.ContextExternalToolEntity, context);
		}
	}
}
