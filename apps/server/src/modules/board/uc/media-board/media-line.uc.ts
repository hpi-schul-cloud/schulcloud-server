import { Action, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import type { MediaBoard, MediaLine } from '@shared/domain/domainobject';
import type { User as UserEntity } from '@shared/domain/entity';
import type { EntityId } from '@shared/domain/types';
import type { MediaBoardConfig } from '../../media-board.config';
import { MediaBoardService, MediaLineService } from '../../service';
import { BoardNodePermissionService } from '../../poc/service';

@Injectable()
export class MediaLineUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly mediaBoardService: MediaBoardService,
		private readonly mediaLineService: MediaLineService,
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

		const targetBoard: MediaBoard = await this.mediaBoardService.findById(targetBoardId);

		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		await this.boardNodePermissionService.checkPermission(user.id, targetBoard, Action.write);

		const line: MediaLine = await this.mediaLineService.findById(lineId);

		await this.mediaLineService.move(line, targetBoard, targetPosition);
	}

	public async updateLineTitle(userId: EntityId, lineId: EntityId, title: string): Promise<void> {
		this.checkFeatureEnabled();

		const line: MediaLine = await this.mediaLineService.findById(lineId);

		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		await this.boardNodePermissionService.checkPermission(user.id, line, Action.write);

		await this.mediaLineService.updateTitle(line, title);
	}

	public async deleteLine(userId: EntityId, lineId: EntityId): Promise<void> {
		this.checkFeatureEnabled();

		const line: MediaLine = await this.mediaLineService.findById(lineId);

		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		await this.boardNodePermissionService.checkPermission(user.id, line, Action.write);

		await this.mediaLineService.delete(line);
	}

	private checkFeatureEnabled() {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
