import { Action, AuthorizationService } from '@modules/authorization';
import { ContextExternalToolWithId } from '@modules/tool/context-external-tool/domain';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalToolWithId } from '@modules/tool/school-external-tool/domain';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { User as UserEntity } from '@shared/domain/entity';
import type { EntityId } from '@shared/domain/types';
import { MediaBoardElementAlreadyExistsLoggableException } from '../../loggable';
import type { MediaBoardConfig } from '../../media-board.config';

import { MediaBoard, MediaExternalToolElement, MediaLine } from '../../poc/domain';
import { BoardNodePermissionService, BoardNodeService } from '../../poc/service';
import { MediaBoardService } from '../../poc/service/media-board';
import { AnyMediaBoardNode } from '../../poc/domain/media-board/types/any-media-board-node';
import { MediaBoardFactory } from '../../poc/domain/media-board/media-board-factory';

@Injectable()
export class MediaElementUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly configService: ConfigService<MediaBoardConfig, true>,
		private readonly mediaBoardService: MediaBoardService,
		private readonly mediaBoardFactory: MediaBoardFactory,
		private readonly schoolExternalToolService: SchoolExternalToolService
	) {}

	public async moveElement(
		userId: EntityId,
		elementId: EntityId,
		targetLineId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.checkFeatureEnabled();

		const targetLine: MediaLine = await this.boardNodeService.findByClassAndId(MediaLine, targetLineId);

		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);

		await this.boardNodePermissionService.checkPermission(user.id, targetLine, Action.write);

		const element: MediaExternalToolElement = await this.boardNodeService.findByClassAndId(
			MediaExternalToolElement,
			elementId
		);

		await this.boardNodeService.move(elementId, targetLineId, targetPosition);
	}

	private checkFeatureEnabled() {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}

	public async createElement(
		userId: EntityId,
		schoolExternalToolId: EntityId,
		lineId: EntityId,
		position: number
	): Promise<MediaExternalToolElement> {
		this.checkFeatureEnabled();

		const line: MediaLine = await this.boardNodeService.findByClassAndId(MediaLine, lineId);

		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);

		await this.boardNodePermissionService.checkPermission(userId, line, Action.write);

		const rootId = line.ancestorIds[0];
		const mediaBoard: MediaBoard = await this.boardNodeService.findByClassAndId(MediaBoard, rootId);

		const schoolExternalTool: SchoolExternalToolWithId = await this.schoolExternalToolService.findById(
			schoolExternalToolId
		);

		await this.checkElementExistsAlreadyOnBoardAndThrow(mediaBoard, schoolExternalTool);

		const createdContexExternalTool: ContextExternalToolWithId =
			await this.mediaBoardService.createContextExternalToolForMediaBoard(
				user.school.id,
				schoolExternalTool,
				mediaBoard
			);

		const createdElement: AnyMediaBoardNode = this.mediaBoardFactory.buildExternalToolElement({
			contextExternalToolId: createdContexExternalTool.id,
		});
		await this.mediaBoardService.addToMediaLine(line, createdElement, position);

		return createdElement;
	}

	private async checkElementExistsAlreadyOnBoardAndThrow(
		mediaBoard: MediaBoard,
		schoolExternalTool: SchoolExternalToolWithId
	): Promise<void> {
		const exists = await this.mediaBoardService.checkElementExists(mediaBoard, schoolExternalTool);

		if (exists) {
			throw new MediaBoardElementAlreadyExistsLoggableException(mediaBoard.id, schoolExternalTool.id);
		}
	}

	public async deleteElement(userId: EntityId, elementId: EntityId): Promise<void> {
		this.checkFeatureEnabled();
		// TODO in case you have more than one element, implement and use findContentElementById in media-board.service.ts
		const element = await this.boardNodeService.findByClassAndId(MediaExternalToolElement, elementId);

		await this.boardNodePermissionService.checkPermission(userId, element, Action.write);

		await this.boardNodeService.delete(element);
	}
}
