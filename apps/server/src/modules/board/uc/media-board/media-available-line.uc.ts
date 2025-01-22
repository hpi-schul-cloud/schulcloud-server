import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, AuthorizationService } from '@modules/authorization';
import { MediaSchoolLicense, MediaSchoolLicenseService } from '@modules/school-license';
import { MediaUserLicense, MediaUserLicenseService } from '@modules/user-license';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
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

		const matchedTools: [ExternalTool, SchoolExternalTool][] = this.mediaAvailableLineService.matchTools(
			availableExternalTools,
			schoolExternalToolsForAvailableMediaLine
		);

		const filteredTools = await this.getFilteredTools(userId, user.school.id, matchedTools);

		const mediaAvailableLine: MediaAvailableLine = this.mediaAvailableLineService.createMediaAvailableLine(
			mediaBoard,
			filteredTools
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

	private async getFilteredTools(
		userId: EntityId,
		schoolId: EntityId,
		matchedTools: [ExternalTool, SchoolExternalTool][]
	): Promise<[ExternalTool, SchoolExternalTool][]> {
		let filteredTools = matchedTools;

		if (this.configService.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')) {
			filteredTools = await this.filterUnlicensedToolsForUser(userId, filteredTools);
		}

		if (this.configService.get('FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED')) {
			filteredTools = await this.filterUnlicensedToolsForUserAndSchool(schoolId, matchedTools, filteredTools);
		}

		return filteredTools;
	}

	private async filterUnlicensedToolsForUser(
		userId: EntityId,
		tools: [ExternalTool, SchoolExternalTool][]
	): Promise<[ExternalTool, SchoolExternalTool][]> {
		const mediaUserLicenses: MediaUserLicense[] = await this.mediaUserLicenseService.getMediaUserLicensesForUser(
			userId
		);

		const filteredTools = tools.filter((tool: [ExternalTool, SchoolExternalTool]): boolean => {
			const externalToolMedium = tool[0]?.medium;
			if (externalToolMedium) {
				return this.mediaUserLicenseService.hasLicenseForExternalTool(externalToolMedium, mediaUserLicenses);
			}
			return true;
		});
		return filteredTools;
	}

	private async filterUnlicensedToolsForUserAndSchool(
		schoolId: EntityId,
		tools: [ExternalTool, SchoolExternalTool][],
		userTools: [ExternalTool, SchoolExternalTool][]
	): Promise<[ExternalTool, SchoolExternalTool][]> {
		const schoolLicenses: MediaSchoolLicense[] = await this.mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId(
			schoolId
		);

		const filteredTools = tools.filter((tool: [ExternalTool, SchoolExternalTool]): boolean => {
			const externalToolMedium = tool[0]?.medium;
			if (externalToolMedium) {
				return this.mediaSchoolLicenseService.hasLicenseForExternalTool(externalToolMedium, schoolLicenses);
			}
			return true;
		});
		const filteredToolsForUserAndSchool = Array.from(new Set([...filteredTools, ...userTools]));
		return filteredToolsForUserAndSchool;
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
