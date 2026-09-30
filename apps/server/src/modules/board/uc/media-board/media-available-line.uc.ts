import { AuthorizationService } from '@modules/authorization';
import { Group, GroupService } from '@modules/group';
import { MediaGroupLicense, MediaGroupLicenseService } from '@modules/group-license';
import { MediaSchoolLicense, MediaSchoolLicenseService } from '@modules/school-license';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { MediaUserLicense, MediaUserLicenseService } from '@modules/user-license';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { throwForbiddenIfFalse } from '@shared/common/utils';
import { EntityId } from '@shared/domain/types';
import { BoardNodeRule } from '../../authorisation/board-node.rule';
import { MediaAvailableLine, MediaBoard } from '../../domain';
import { Colors } from '../../domain/media-board/types';

import { BOARD_CONFIG_TOKEN, BoardConfig } from '../../board.config';
import {
	BoardNodeAuthorizableService,
	BoardNodeService,
	MediaAvailableLineService,
	MediaBoardService,
} from '../../service';

@Injectable()
export class MediaAvailableLineUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodeRule: BoardNodeRule,
		private readonly boardNodeService: BoardNodeService,
		private readonly mediaAvailableLineService: MediaAvailableLineService,
		private readonly mediaBoardService: MediaBoardService,
		@Inject(BOARD_CONFIG_TOKEN) private readonly config: BoardConfig,
		private readonly mediaUserLicenseService: MediaUserLicenseService,
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		@Optional() private readonly mediaGroupLicenseService?: MediaGroupLicenseService,
		@Optional() private readonly groupService?: GroupService
	) {}

	public async getMediaAvailableLine(userId: EntityId, boardId: EntityId): Promise<MediaAvailableLine> {
		this.checkFeatureEnabled();

		const board: MediaBoard = await this.boardNodeService.findByClassAndId(MediaBoard, boardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);

		throwForbiddenIfFalse(this.boardNodeRule.can('viewMediaBoard', user, boardNodeAuthorizable));

		const schoolExternalToolsForAvailableMediaLine: SchoolExternalTool[] =
			await this.mediaAvailableLineService.getUnusedAvailableSchoolExternalTools(user, board);

		const availableExternalTools: ExternalTool[] =
			await this.mediaAvailableLineService.getAvailableExternalToolsForSchool(schoolExternalToolsForAvailableMediaLine);

		const matchedTools: [ExternalTool, SchoolExternalTool][] = this.mediaAvailableLineService.matchTools(
			availableExternalTools,
			schoolExternalToolsForAvailableMediaLine
		);

		const filteredTools = await this.getFilteredTools(userId, user.school.id, matchedTools);

		const mediaAvailableLine: MediaAvailableLine = this.mediaAvailableLineService.createMediaAvailableLine(
			board,
			filteredTools
		);

		return mediaAvailableLine;
	}

	public async updateAvailableLineColor(userId: EntityId, boardId: EntityId, color: Colors): Promise<void> {
		this.checkFeatureEnabled();

		const board: MediaBoard = await this.boardNodeService.findByClassAndId(MediaBoard, boardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);

		throwForbiddenIfFalse(this.boardNodeRule.can('updateMediaBoardColor', user, boardNodeAuthorizable));

		await this.mediaBoardService.updateBackgroundColor(board, color);
	}

	public async collapseAvailableLine(
		userId: EntityId,
		boardId: EntityId,
		mediaAvailableLineCollapsed: boolean
	): Promise<void> {
		this.checkFeatureEnabled();

		const board: MediaBoard = await this.boardNodeService.findByClassAndId(MediaBoard, boardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);

		throwForbiddenIfFalse(this.boardNodeRule.can('collapseMediaBoard', user, boardNodeAuthorizable));

		await this.mediaBoardService.updateCollapsed(board, mediaAvailableLineCollapsed);
	}

	private async getFilteredTools(
		userId: EntityId,
		schoolId: EntityId,
		matchedTools: [ExternalTool, SchoolExternalTool][]
	): Promise<[ExternalTool, SchoolExternalTool][]> {
		let filteredTools = matchedTools;

		if (this.config.featureSchulconnexMediaLicenseEnabled) {
			filteredTools = await this.filterUnlicensedTools(userId, schoolId, filteredTools);
		}

		if (this.config.featureVidisMediaActivationsEnabled) {
			filteredTools = await this.getToolsForUserAndSchool(schoolId, matchedTools, filteredTools);
		}

		return filteredTools;
	}

	private async filterUnlicensedTools(
		userId: EntityId,
		schoolId: EntityId,
		tools: [ExternalTool, SchoolExternalTool][]
	): Promise<[ExternalTool, SchoolExternalTool][]> {
		const mediaUserLicenses: MediaUserLicense[] =
			(await this.mediaUserLicenseService.getMediaUserLicensesForUser(userId)) ?? [];

		let mediaGroupLicenses: MediaGroupLicense[] = [];
		if (this.mediaGroupLicenseService && this.groupService) {
			const userGroups = await this.groupService.findGroups({ userId, schoolId });
			if (userGroups && Array.isArray(userGroups.data)) {
				const userGroupIds = userGroups.data.map((group: Group) => group.id);
				if (userGroupIds.length > 0) {
					const foundGroupLicenses = await this.mediaGroupLicenseService.findMediaGroupLicensesByGroupIds(userGroupIds);
					if (Array.isArray(foundGroupLicenses)) {
						mediaGroupLicenses = foundGroupLicenses;
					}
				}
			}
		}

		let mediaSchoolLicenses: MediaSchoolLicense[] = [];
		if (this.mediaSchoolLicenseService) {
			const foundSchoolLicenses = await this.mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId(schoolId);
			if (Array.isArray(foundSchoolLicenses)) {
				mediaSchoolLicenses = foundSchoolLicenses;
			}
		}

		const filteredTools = tools.filter((tool: [ExternalTool, SchoolExternalTool]): boolean => {
			const externalToolMedium = tool[0]?.medium;
			if (externalToolMedium) {
				const hasUserLicense = this.mediaUserLicenseService.hasLicenseForExternalTool(
					externalToolMedium,
					mediaUserLicenses
				);
				if (hasUserLicense) {
					return true;
				}

				if (this.mediaGroupLicenseService && mediaGroupLicenses.length > 0) {
					const hasGroupLicense = this.mediaGroupLicenseService.hasLicenseForExternalTool(
						externalToolMedium,
						mediaGroupLicenses
					);
					if (hasGroupLicense) {
						return true;
					}
				}

				if (this.mediaSchoolLicenseService && mediaSchoolLicenses.length > 0) {
					const hasSchoolLicense = this.mediaSchoolLicenseService.hasLicenseForExternalTool(
						externalToolMedium,
						mediaSchoolLicenses
					);
					if (hasSchoolLicense) {
						return true;
					}
				}

				return false;
			}
			return true;
		});

		return filteredTools;
	}

	private async getToolsForUserAndSchool(
		schoolId: EntityId,
		tools: [ExternalTool, SchoolExternalTool][],
		userTools: [ExternalTool, SchoolExternalTool][]
	): Promise<[ExternalTool, SchoolExternalTool][]> {
		const schoolLicenses: MediaSchoolLicense[] =
			await this.mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId(schoolId);

		const schoolTools = tools.filter((tool: [ExternalTool, SchoolExternalTool]): boolean => {
			const externalToolMedium = tool[0]?.medium;
			if (externalToolMedium) {
				return this.mediaSchoolLicenseService.hasLicenseForExternalTool(externalToolMedium, schoolLicenses);
			}
			return true;
		});

		const schoolAndUserTools = Array.from(new Set([...schoolTools, ...userTools]));

		return schoolAndUserTools;
	}

	private checkFeatureEnabled(): void {
		if (!this.config.featureMediaShelfEnabled) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
