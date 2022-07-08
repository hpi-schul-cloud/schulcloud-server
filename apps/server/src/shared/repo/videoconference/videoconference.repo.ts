import { Injectable } from '@nestjs/common';
import { EntityId, VideoConferenceDO } from '@shared/domain';
import { TargetModels, VideoConference } from '@shared/domain/entity/video-conference.entity';
import { VideoConferenceScope } from '@shared/domain/interface/vc-scope.enum';
import { BaseRepo } from '../base.repo';

const TargetModelsMapping = {
	[VideoConferenceScope.EVENT]: TargetModels.EVENTS,
	[VideoConferenceScope.COURSE]: TargetModels.COURSES,
};

const VideoConferencingScopeMapping = {
	[TargetModels.EVENTS]: VideoConferenceScope.EVENT,
	[TargetModels.COURSES]: VideoConferenceScope.COURSE,
};

@Injectable()
export class VideoconferenceRepo extends BaseRepo<VideoConference> {
	get entityName() {
		return VideoConference;
	}

	cacheExpiration = 60000;

	async findDOById(id: EntityId): Promise<VideoConferenceDO> {
		const entity = await this._em.findOneOrFail(VideoConference, { id }, { cache: this.cacheExpiration });

		return this.mapToDO(entity);
	}

	async findByScopeId(target: string, targetModel: TargetModels): Promise<VideoConferenceDO> {
		const entity = await this._em.findOneOrFail(
			VideoConference,
			{ target, targetModel },
			{ cache: this.cacheExpiration }
		);

		return this.mapToDO(entity);
	}

	private mapToDO(entity: VideoConference): VideoConferenceDO {
		return new VideoConferenceDO({
			id: entity.id,
			target: entity.target,
			targetModel: VideoConferencingScopeMapping[entity.targetModel],
			options: {
				everybodyJoinsAsModerator: entity.options.everybodyJoinsAsModerator,
				everyAttendeeJoinsMuted: entity.options.everyAttendeJoinsMuted,
				moderatorMustApproveJoinRequests: entity.options.moderatorMustApproveJoinRequests,
			},
		});
	}
}
