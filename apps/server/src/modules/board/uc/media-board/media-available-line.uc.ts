import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { MediaUserLicense, UserLicenseService } from '@modules/user-license';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { BoardDoAuthorizable, MediaAvailableLine, type MediaBoard } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ExternalTool } from '@src/modules/tool/external-tool/domain';
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
		private readonly userLicenceService: UserLicenseService
	) {}

	public async getMediaAvailableLine(userId: EntityId, boardId: EntityId): Promise<MediaAvailableLine> {
		this.checkFeatureEnabled();

		const mediaBoard: MediaBoard = await this.mediaBoardService.findById(boardId);

		const user: User = await this.checkUsersPermissions(userId, mediaBoard);

		const schoolExternalToolsForAvailableMediaLine: SchoolExternalTool[] =
			await this.mediaAvailableLineService.getUnusedAvailableSchoolExternalTools(user, mediaBoard);

		const availableExternalTools: ExternalTool[] =
			await this.mediaAvailableLineService.getAvailableExternalToolsForSchool(schoolExternalToolsForAvailableMediaLine);

		const matchedTools: [ExternalTool, SchoolExternalTool][] = this.mediaAvailableLineService.matchTools(
			availableExternalTools,
			schoolExternalToolsForAvailableMediaLine
		);

		let matchedAndLicencedTools: [ExternalTool, SchoolExternalTool][] = [];
		// TODO: N21-1881 use configService?
		if (Configuration.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')) {
			const mediaUserLicenses: MediaUserLicense[] = await this.userLicenceService.getMediaUserLicensesForUser(userId);

			matchedAndLicencedTools = matchedTools.filter((tool: [ExternalTool, SchoolExternalTool]): boolean => {
				const externalTool: ExternalTool = tool[0];
				if (externalTool?.medium?.mediumId) {
					return this.userLicenceService.checkLicenceForExternalTool(externalTool.medium.mediumId, mediaUserLicenses);
				}
				return true;
			});
		}

		const mediaAvailableLine: MediaAvailableLine = this.mediaAvailableLineService.createMediaAvailableLine(
			matchedAndLicencedTools ?? matchedTools
		);

		return mediaAvailableLine;
	}

	private async checkUsersPermissions(userId: EntityId, mediaBoard: MediaBoard): Promise<User> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable: BoardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(
			mediaBoard
		);
		this.authorizationService.checkPermission(user, boardDoAuthorizable, AuthorizationContextBuilder.read([]));

		return user;
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
