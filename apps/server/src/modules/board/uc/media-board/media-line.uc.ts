import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { type MediaBoard, type MediaLine } from '@shared/domain/domainobject';
import type { User as UserEntity } from '@shared/domain/entity';
import type { EntityId } from '@shared/domain/types';
import { MediaBoardService, MediaLineService } from '../../service';

@Injectable()
export class MediaLineUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly mediaBoardService: MediaBoardService,
		private readonly mediaLineService: MediaLineService
	) {}

	public async moveLine(
		userId: EntityId,
		lineId: EntityId,
		targetBoardId: EntityId,
		targetPosition: number
	): Promise<void> {
		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, user, AuthorizationContextBuilder.read([]));

		const targetBoard: MediaBoard = await this.mediaBoardService.findById(targetBoardId);

		const line: MediaLine = await this.mediaLineService.findById(lineId);

		await this.mediaLineService.move(line, targetBoard, targetPosition);
	}

	public async updateLineTitle(userId: EntityId, lineId: EntityId, title: string): Promise<void> {
		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, user, AuthorizationContextBuilder.read([]));

		const line: MediaLine = await this.mediaLineService.findById(lineId);

		await this.mediaLineService.updateTitle(line, title);
	}

	public async deleteLine(userId: EntityId, lineId: EntityId): Promise<void> {
		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, user, AuthorizationContextBuilder.read([]));

		const line: MediaLine = await this.mediaLineService.findById(lineId);

		await this.mediaLineService.delete(line);
	}
}
