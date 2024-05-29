import { Action, AuthorizationService } from '@modules/authorization';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { MediaUserLicense, UserLicenseService } from '@modules/user-license';
import { MediaUserLicenseService } from '@modules/user-license/service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain/types';
import { MediaAvailableLine, MediaBoard } from '../../domain';
import type { MediaBoardConfig } from '../../media-board.config';
import {
	BoardNodePermissionService,
	BoardNodeService,
	MediaAvailableLineService,
	MediaBoardService,
} from '../../service';
import { MediaBoardColors } from '../../domain/media-board/types';

@Injectable()
export class MediaAvailableLineUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly boardNodeService: BoardNodeService,
		private readonly mediaAvailableLineService: MediaAvailableLineService,
		private readonly mediaBoardService: MediaBoardService,
		private readonly configService: ConfigService<MediaBoardConfig, true>,
		private readonly userLicenseService: UserLicenseService,
		private readonly mediaUserLicenseService: MediaUserLicenseService
	) {}

	public async getMediaAvailableLine(userId: EntityId, boardId: EntityId): Promise<MediaAvailableLine> {
		this.checkFeatureEnabled();

		const mediaBoard: MediaBoard = await this.boardNodeService.findByClassAndId(MediaBoard, boardId);

		await this.boardNodePermissionService.checkPermission(userId, mediaBoard, Action.read);

		const user = await this.authorizationService.getUserWithPermissions(userId);
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

		const mediaAvailableLine: MediaAvailableLine = this.mediaAvailableLineService.createMediaAvailableLine(
			mediaBoard,
			matchedTools
		);

		return mediaAvailableLine;
	}

	public async updateAvailableLineColor(userId: EntityId, boardId: EntityId, color: MediaBoardColors): Promise<void> {
		this.checkFeatureEnabled();

		const board: MediaBoard = await this.boardNodeService.findByClassAndId(MediaBoard, boardId);

		await this.boardNodePermissionService.checkPermission(userId, board, Action.write);

		await this.mediaBoardService.updateBackgroundColor(board, color);
	}

	public async collapseAvailableLine(
		userId: EntityId,
		boardId: EntityId,
		mediaAvailableLineCollapsed: boolean
	): Promise<void> {
		this.checkFeatureEnabled();

		const board: MediaBoard = await this.boardNodeService.findByClassAndId(MediaBoard, boardId);

		await this.boardNodePermissionService.checkPermission(userId, board, Action.write);

		await this.mediaBoardService.updateCollapsed(board, mediaAvailableLineCollapsed);
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
			const externalToolMedium = tool[0]?.medium;
			if (externalToolMedium) {
				return this.mediaUserLicenseService.hasLicenseForExternalTool(externalToolMedium, mediaUserLicenses);
			}
			return true;
		});

		return matchedTools;
	}
}
