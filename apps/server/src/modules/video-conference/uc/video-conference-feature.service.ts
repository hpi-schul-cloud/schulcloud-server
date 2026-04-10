import { BoardContextApiHelperService } from '@modules/board-context/board-context-api-helper.service';
import { BoardFeature } from '@modules/board/domain';
import { LegacySchoolService } from '@modules/legacy-school/service';
import { SchoolFeature } from '@modules/school/domain';
import { UserService } from '@modules/user';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { VideoConferenceScope } from '../domain';
import { VIDEO_CONFERENCE_CONFIG_TOKEN, VideoConferenceConfig } from '../video-conference-config';
import { ScopeRef } from './dto';

@Injectable()
export class VideoConferenceFeatureService {
	constructor(
		private readonly boardContextApiHelperService: BoardContextApiHelperService,
		private readonly userService: UserService,
		private readonly legacySchoolService: LegacySchoolService,
		@Inject(VIDEO_CONFERENCE_CONFIG_TOKEN) private readonly config: VideoConferenceConfig
	) {}

	public async checkVideoConferenceFeatureEnabled(userId: EntityId, scope: ScopeRef): Promise<void> {
		if (scope.scope === VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT) {
			const features = await this.boardContextApiHelperService.getFeaturesForBoardNode(scope.id);
			if (!features.includes(BoardFeature.VIDEOCONFERENCE)) {
				throw new ForbiddenException('Videoconference disabled for board element');
			}
			return;
		}

		/* need to be replace with
		const [authorizableUser, scopeResource]: [User, TeamEntity | Course] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.videoConferenceService.loadScopeResources(scopeId, scope),
		]);
		*/
		const user = await this.userService.findById(userId);

		if (!((await this.isVideoConferenceEnabledForSchool(user.schoolId)) && this.isVideoConferenceEnabledForConfig())) {
			throw new ForbiddenException('Videoconference disabled for school or globally');
		}
	}

	private isVideoConferenceEnabledForSchool(schoolId: EntityId): Promise<boolean> {
		return this.legacySchoolService.hasFeature(schoolId, SchoolFeature.VIDEOCONFERENCE);
	}

	private isVideoConferenceEnabledForConfig(): boolean {
		return this.config.featureVideoConferenceEnabled;
	}
}
