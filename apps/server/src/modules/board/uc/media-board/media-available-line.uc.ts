import { Action, AuthorizationService } from '@modules/authorization';
import { MediaSchoolLicense, MediaSchoolLicenseService } from '@modules/school-license';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { MediaUserLicense, MediaUserLicenseService } from '@modules/user-license';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain/types';
import { MediaAvailableLine, MediaBoard } from '../../domain';
import { MediaBoardColors } from '../../domain/media-board/types';
import type { MediaBoardConfig } from '../../media-board.config';
import {
	BoardNodePermissionService,
	BoardNodeService,
	MediaAvailableLineService,
	MediaBoardService,
} from '../../service';

@Injectable()
export class MediaAvailableLineUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly boardNodeService: BoardNodeService,
		private readonly mediaAvailableLineService: MediaAvailableLineService,
		private readonly mediaBoardService: MediaBoardService,
		private readonly configService: ConfigService<MediaBoardConfig, true>,
		private readonly mediaUserLicenseService: MediaUserLicenseService,
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService
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

		const availableTools: [ExternalTool, SchoolExternalTool][] = this.mediaAvailableLineService.matchTools(
			availableExternalTools,
			schoolExternalToolsForAvailableMediaLine
		);

		let matchedTools = [...availableTools];

		if (this.configService.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')) {
			matchedTools = await this.filterUnlicensedToolsForUser(userId, matchedTools);
		}

		if (this.configService.get('FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED')) {
			const matchedToolsForSchool = await this.filterUnlicensedToolsForSchool(user.school.id, availableTools);
			matchedTools = Array.from(new Set([...matchedTools, ...matchedToolsForSchool]));
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

	private async filterUnlicensedToolsForUser(
		userId: EntityId,
		matchedTools: [ExternalTool, SchoolExternalTool][]
	): Promise<[ExternalTool, SchoolExternalTool][]> {
		const mediaUserLicenses: MediaUserLicense[] = await this.mediaUserLicenseService.getMediaUserLicensesForUser(
			userId
		);

		matchedTools = matchedTools.filter((tool: [ExternalTool, SchoolExternalTool]): boolean => {
			const externalToolMedium = tool[0]?.medium;
			if (externalToolMedium) {
				return this.mediaUserLicenseService.hasLicenseForExternalTool(externalToolMedium, mediaUserLicenses);
			}
			return true;
		});

		return matchedTools;
	}

	private async filterUnlicensedToolsForSchool(
		schoolId: EntityId,
		matchedTools: [ExternalTool, SchoolExternalTool][]
	): Promise<[ExternalTool, SchoolExternalTool][]> {
		const mediaSchoolLicenses: MediaSchoolLicense[] =
			await this.mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId(schoolId);

		matchedTools = matchedTools.filter((tool: [ExternalTool, SchoolExternalTool]): boolean => {
			const externalToolMedium = tool[0]?.medium;
			if (externalToolMedium) {
				return this.mediaSchoolLicenseService.hasLicenseForExternalTool(externalToolMedium, mediaSchoolLicenses);
			}
			return true;
		});

		return matchedTools;
	}
}
