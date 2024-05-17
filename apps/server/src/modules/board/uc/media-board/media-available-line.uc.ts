import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { MediaUserLicense, UserLicenseService } from '@modules/user-license';
import { MediaUserLicenseService } from '@modules/user-license/service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { BoardDoAuthorizable, MediaAvailableLine, type MediaBoard } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ExternalTool } from '@src/modules/tool/external-tool/domain';
import { MediaBoardColors } from '../../domain';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardDoAuthorizableService, MediaAvailableLineService, MediaBoardService } from '../../service';

@Injectable()
export class MediaAvailableLineUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly mediaAvailableLineService: MediaAvailableLineService,
		private readonly configService: ConfigService<MediaBoardConfig, true>,
		private readonly mediaBoardService: MediaBoardService,
		private readonly userLicenseService: UserLicenseService,
		private readonly mediaUserLicenseService: MediaUserLicenseService
	) {}

	public async getMediaAvailableLine(userId: EntityId, boardId: EntityId): Promise<MediaAvailableLine> {
		this.checkFeatureEnabled();

		const mediaBoard: MediaBoard = await this.mediaBoardService.findById(boardId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable: BoardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(
			mediaBoard
		);
		this.authorizationService.checkPermission(user, boardDoAuthorizable, AuthorizationContextBuilder.read([]));

		const schoolExternalToolsForAvailableMediaLine: SchoolExternalTool[] =
			await this.mediaAvailableLineService.getUnusedAvailableSchoolExternalTools(user, mediaBoard);

		const availableExternalTools: ExternalTool[] =
			await this.mediaAvailableLineService.getAvailableExternalToolsForSchool(schoolExternalToolsForAvailableMediaLine);

		let matchedTools: [ExternalTool, SchoolExternalTool][] = this.mediaAvailableLineService.matchTools(
			availableExternalTools,
			schoolExternalToolsForAvailableMediaLine
		);

		if (this.configService.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')) {
			matchedTools = await this.filterUnlicensedTools(userId, matchedTools);
		}

		const mediaAvailableLine: MediaAvailableLine =
			this.mediaAvailableLineService.createMediaAvailableLine(matchedTools);

		mediaAvailableLine.backgroundColor = mediaBoard.mediaAvailableLineBackgroundColor;
		mediaAvailableLine.collapsed = mediaBoard.mediaAvailableLineCollapsed;

		return mediaAvailableLine;
	}

	public async updateAvailableLineColor(userId: EntityId, boardId: EntityId, color: MediaBoardColors): Promise<void> {
		this.checkFeatureEnabled();

		const board: MediaBoard = await this.mediaBoardService.findById(boardId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable: BoardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(board);
		this.authorizationService.checkPermission(user, boardDoAuthorizable, AuthorizationContextBuilder.write([]));

		await this.mediaBoardService.updateAvailableLineColor(board, color);
	}

	public async collapseAvailableLine(
		userId: EntityId,
		boardId: EntityId,
		mediaAvailableLineCollapsed: boolean
	): Promise<void> {
		this.checkFeatureEnabled();

		const board: MediaBoard = await this.mediaBoardService.findById(boardId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable: BoardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(board);
		this.authorizationService.checkPermission(user, boardDoAuthorizable, AuthorizationContextBuilder.write([]));

		await this.mediaBoardService.collapseAvailableLine(board, mediaAvailableLineCollapsed);
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}

	private async filterUnlicensedTools(
		userId: EntityId,
		matchedTools: [ExternalTool, SchoolExternalTool][]
	): Promise<[ExternalTool, SchoolExternalTool][]> {
		const mediaUserLicenses: MediaUserLicense[] = await this.userLicenseService.getMediaUserLicensesForUser(userId);

		matchedTools = matchedTools.filter((tool: [ExternalTool, SchoolExternalTool]): boolean => {
			const externalToolMediumId = tool[0]?.medium?.mediumId;
			if (externalToolMediumId) {
				return this.mediaUserLicenseService.hasLicenseForExternalTool(externalToolMediumId, mediaUserLicenses);
			}
			return true;
		});

		return matchedTools;
	}
}
