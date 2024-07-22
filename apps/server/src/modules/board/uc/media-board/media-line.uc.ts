import { Action } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import type { EntityId } from '@shared/domain/types';
import { MediaBoard, MediaLine } from '../../domain';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardNodePermissionService, BoardNodeService } from '../../service';
import { MediaBoardService } from '../../service/media-board';
import { MediaBoardColors } from '../../domain/media-board/types';

@Injectable()
export class MediaLineUc {
	constructor(
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly configService: ConfigService<MediaBoardConfig, true>,
		private readonly mediaBoardService: MediaBoardService
	) {}

	public async moveLine(
		userId: EntityId,
		lineId: EntityId,
		targetBoardId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.checkFeatureEnabled();

		const line = await this.boardNodeService.findByClassAndId(MediaLine, lineId);
		const targetBoard = await this.boardNodeService.findByClassAndId(MediaBoard, targetBoardId);

		await this.boardNodePermissionService.checkPermission(userId, targetBoard, Action.write);

		await this.boardNodeService.move(line, targetBoard, targetPosition);
	}

	public async updateLineTitle(userId: EntityId, lineId: EntityId, title: string): Promise<void> {
		this.checkFeatureEnabled();

		const line: MediaLine = await this.boardNodeService.findByClassAndId(MediaLine, lineId);

		await this.boardNodePermissionService.checkPermission(userId, line, Action.write);

		await this.boardNodeService.updateTitle(line, title);
	}

	public async updateLineColor(userId: EntityId, lineId: EntityId, color: MediaBoardColors): Promise<void> {
		this.checkFeatureEnabled();

		const line: MediaLine = await this.boardNodeService.findByClassAndId(MediaLine, lineId);

		await this.boardNodePermissionService.checkPermission(userId, line, Action.write);

		await this.mediaBoardService.updateBackgroundColor(line, color);
	}

	public async collapseLine(userId: EntityId, lineId: EntityId, collapsed: boolean): Promise<void> {
		this.checkFeatureEnabled();

		const line: MediaLine = await this.boardNodeService.findByClassAndId(MediaLine, lineId);

		await this.boardNodePermissionService.checkPermission(userId, line, Action.write);

		await this.mediaBoardService.updateCollapsed(line, collapsed);
	}

	public async deleteLine(userId: EntityId, lineId: EntityId): Promise<void> {
		this.checkFeatureEnabled();

		const line = await this.boardNodeService.findByClassAndId(MediaLine, lineId);

		await this.boardNodePermissionService.checkPermission(userId, line, Action.write);

		await this.boardNodeService.delete(line);
	}

	private checkFeatureEnabled() {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
