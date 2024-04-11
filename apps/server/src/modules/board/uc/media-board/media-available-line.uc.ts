import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { BoardDoAuthorizable, MediaAvailableLine, type MediaBoard } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ExternalTool } from '@src/modules/tool/external-tool/domain';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardDoAuthorizableService, MediaAvailableLineService, MediaBoardService } from '../../service';

@Injectable()
export class MediaAvailableLineUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly mediaAvailableLineService: MediaAvailableLineService,
		private readonly configService: ConfigService<MediaBoardConfig, true>,
		private readonly mediaBoardService: MediaBoardService
	) {}

	public async getMediaAvailableLine(userId: EntityId, boardId: EntityId): Promise<MediaAvailableLine> {
		this.checkFeatureEnabled();

		const mediaBoard: MediaBoard = await this.mediaBoardService.findById(boardId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable: BoardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(
			mediaBoard
		);
		this.authorizationService.checkPermission(user, boardDoAuthorizable, AuthorizationContextBuilder.write([]));

		const schoolExternalTools: SchoolExternalTool[] =
			await this.mediaAvailableLineService.getUnusedAvailableSchoolExternalTools(user, mediaBoard);

		const availableExternalTools: ExternalTool[] =
			await this.mediaAvailableLineService.getAvailableExternalToolsForSchool(schoolExternalTools);

		const matchedTools: [ExternalTool, SchoolExternalTool][] = this.mediaAvailableLineService.matchTools(
			availableExternalTools,
			schoolExternalTools
		);

		const mediaAvailableLine: MediaAvailableLine =
			this.mediaAvailableLineService.createMediaAvailableLine(matchedTools);

		return mediaAvailableLine;
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
