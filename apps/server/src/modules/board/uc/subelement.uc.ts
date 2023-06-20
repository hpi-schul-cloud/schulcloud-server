import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AnyBoardDo, EntityId } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { Action } from '@src/modules/authorization/types/action.enum';
import { SubmissionContentBody } from '../controller/dto';
import { BoardDoAuthorizableService, ContentSubElementService } from '../service';

@Injectable()
export class SubElementUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly subElementService: ContentSubElementService,
		private readonly logger: Logger
	) {
		this.logger.setContext(SubElementUc.name);
	}

	async updateSubElementContent(userId: EntityId, elementId: EntityId, content: SubmissionContentBody) {
		const subElement = await this.subElementService.findById(elementId);

		// TODO
		await this.checkPermission(userId, subElement, Action.read);

		await this.subElementService.update(subElement, content);
	}

	private async checkPermission(userId: EntityId, boardDo: AnyBoardDo, action: Action): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(boardDo);
		const context = { action, requiredPermissions: [] };

		return this.authorizationService.checkPermission(user, boardDoAuthorizable, context);
	}
}
