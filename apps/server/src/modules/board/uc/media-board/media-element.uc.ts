import { AuthorizationService } from '@modules/authorization';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { throwForbiddenIfFalse } from '@shared/common/utils';
import type { EntityId } from '@shared/domain/types';
import { BoardNodeRule } from '../../authorisation/board-node.rule';
import { MediaBoard, MediaBoardNodeFactory, MediaExternalToolElement, MediaLine } from '../../domain';
import { MediaBoardElementAlreadyExistsLoggableException } from '../../loggable';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardNodeAuthorizableService, BoardNodeService, MediaBoardService } from '../../service';

@Injectable()
export class MediaElementUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodeRule: BoardNodeRule,
		private readonly configService: ConfigService<MediaBoardConfig, true>,
		private readonly mediaBoardService: MediaBoardService,
		private readonly mediaBoardNodeFactory: MediaBoardNodeFactory,
		private readonly schoolExternalToolService: SchoolExternalToolService
	) {}

	public async moveElement(
		userId: EntityId,
		elementId: EntityId,
		targetLineId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.checkFeatureEnabled();

		const element = await this.boardNodeService.findAnyMediaElementById(elementId);
		const targetLine = await this.boardNodeService.findByClassAndId(MediaLine, targetLineId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(targetLine);

		throwForbiddenIfFalse(this.boardNodeRule.canMoveElement(user, boardNodeAuthorizable));

		await this.boardNodeService.move(element, targetLine, targetPosition);
	}

	public async createElement(
		userId: EntityId,
		schoolExternalToolId: EntityId,
		lineId: EntityId,
		position: number
	): Promise<MediaExternalToolElement> {
		this.checkFeatureEnabled();

		const line = await this.boardNodeService.findByClassAndId(MediaLine, lineId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(line);
		throwForbiddenIfFalse(this.boardNodeRule.canCreateElement(user, boardNodeAuthorizable));

		const mediaBoard = await this.boardNodeService.findByClassAndId(MediaBoard, line.rootId);

		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);

		await this.checkElementExistsAlreadyOnBoardAndThrow(mediaBoard, schoolExternalTool);
		const createdContextExternalTool: ContextExternalTool =
			await this.mediaBoardService.createContextExternalToolForMediaBoard(
				user.school.id,
				schoolExternalTool,
				mediaBoard
			);

		const createdElement: MediaExternalToolElement = this.mediaBoardNodeFactory.buildExternalToolElement({
			contextExternalToolId: createdContextExternalTool.id,
		});
		await this.boardNodeService.addToParent(line, createdElement, position);

		return createdElement;
	}

	public async deleteElement(userId: EntityId, elementId: EntityId): Promise<void> {
		this.checkFeatureEnabled();

		const element = await this.boardNodeService.findAnyMediaElementById(elementId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(element);
		throwForbiddenIfFalse(this.boardNodeRule.canDeleteElement(user, boardNodeAuthorizable));

		await this.boardNodeService.delete(element);
	}

	private checkFeatureEnabled() {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}

	private async checkElementExistsAlreadyOnBoardAndThrow(
		mediaBoard: MediaBoard,
		schoolExternalTool: SchoolExternalTool
	): Promise<void> {
		const exists = await this.mediaBoardService.checkElementExists(mediaBoard, schoolExternalTool);

		if (exists) {
			throw new MediaBoardElementAlreadyExistsLoggableException(mediaBoard.id, schoolExternalTool.id);
		}
	}
}
