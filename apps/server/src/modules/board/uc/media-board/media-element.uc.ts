import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ContextExternalToolWithId } from '@modules/tool/context-external-tool/domain';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalToolWithId } from '@modules/tool/school-external-tool/domain';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import {
	type AnyMediaContentElementDo,
	BoardDoAuthorizable,
	MediaBoard,
	MediaExternalToolElement,
	type MediaLine,
} from '@shared/domain/domainobject';
import { User as UserEntity } from '@shared/domain/entity';
import type { EntityId } from '@shared/domain/types';
import { MediaBoardElementAlreadyExistsLoggableException } from '../../loggable';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardDoAuthorizableService, MediaBoardService, MediaElementService, MediaLineService } from '../../service';

@Injectable()
export class MediaElementUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly mediaLineService: MediaLineService,
		private readonly mediaElementService: MediaElementService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly configService: ConfigService<MediaBoardConfig, true>,
		private readonly mediaBoardService: MediaBoardService,
		private readonly schoolExternalToolService: SchoolExternalToolService
	) {}

	public async moveElement(
		userId: EntityId,
		elementId: EntityId,
		targetLineId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.checkFeatureEnabled();

		const targetLine: MediaLine = await this.mediaLineService.findById(targetLineId);

		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable: BoardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(
			targetLine
		);
		this.authorizationService.checkPermission(user, boardDoAuthorizable, AuthorizationContextBuilder.write([]));

		const element: AnyMediaContentElementDo = await this.mediaElementService.findById(elementId);

		await this.mediaElementService.move(element, targetLine, targetPosition);
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

		const line: MediaLine = await this.mediaLineService.findById(lineId);

		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable: BoardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(line);
		this.authorizationService.checkPermission(user, boardDoAuthorizable, AuthorizationContextBuilder.write([]));

		const mediaBoard: MediaBoard = await this.mediaBoardService.findByDescendant(line);

		const schoolExternalTool: SchoolExternalToolWithId = await this.schoolExternalToolService.findById(
			schoolExternalToolId
		);

		await this.checkElementExistsAlreadyOnBoardAndThrow(mediaBoard, schoolExternalTool);

		const createdContexExternalTool: ContextExternalToolWithId =
			await this.mediaElementService.createContextExternalToolForMediaBoard(user, schoolExternalTool, mediaBoard);

		const createdElement: AnyMediaContentElementDo = await this.mediaElementService.createExternalToolElement(
			line,
			position,
			createdContexExternalTool
		);

		return createdElement;
	}

	private async checkElementExistsAlreadyOnBoardAndThrow(
		mediaBoard: MediaBoard,
		schoolExternalTool: SchoolExternalToolWithId
	): Promise<void> {
		const exists = await this.mediaElementService.checkElementExists(mediaBoard, schoolExternalTool);

		if (exists) {
			throw new MediaBoardElementAlreadyExistsLoggableException(mediaBoard.id, schoolExternalTool.id);
		}
	}

	public async deleteElement(userId: EntityId, elementId: EntityId): Promise<void> {
		this.checkFeatureEnabled();

		const element: AnyMediaContentElementDo = await this.mediaElementService.findById(elementId);

		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable: BoardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(
			element
		);
		this.authorizationService.checkPermission(user, boardDoAuthorizable, AuthorizationContextBuilder.write([]));

		await this.mediaElementService.delete(element);
	}
}
