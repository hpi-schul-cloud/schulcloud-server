import { Action } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import type { EntityId } from '@shared/domain/types';
import type { MediaBoardConfig } from '../../media-board.config';
import { MediaBoard, MediaLine } from '../../domain';
import { BoardNodePermissionService, BoardNodeService } from '../../service';

@Injectable()
export class MediaLineUc {
	constructor(
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly configService: ConfigService<MediaBoardConfig, true>
	) {}

	public async moveLine(
		userId: EntityId,
		lineId: EntityId,
		targetBoardId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.checkFeatureEnabled();

		const targetBoard: MediaBoard = await this.boardNodeService.findByClassAndId(MediaBoard, targetBoardId);

		await this.boardNodePermissionService.checkPermission(userId, targetBoard, Action.write);

		await this.boardNodeService.move(lineId, targetBoardId, targetPosition);
	}

	public async updateLineTitle(userId: EntityId, lineId: EntityId, title: string): Promise<void> {
		this.checkFeatureEnabled();

		const line: MediaLine = await this.boardNodeService.findByClassAndId(MediaLine, lineId);

		await this.boardNodePermissionService.checkPermission(userId, line, Action.write);

		await this.boardNodeService.updateTitle(line, title);
	}

	public async deleteLine(userId: EntityId, lineId: EntityId): Promise<void> {
		this.checkFeatureEnabled();

		const line: MediaLine = await this.boardNodeService.findByClassAndId(MediaLine, lineId);

		await this.boardNodePermissionService.checkPermission(userId, line, Action.write);

		await this.boardNodeService.delete(line);
	}

	private checkFeatureEnabled() {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
