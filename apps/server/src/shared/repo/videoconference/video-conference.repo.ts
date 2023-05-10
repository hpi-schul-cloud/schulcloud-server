import { Injectable } from '@nestjs/common';
import { IVideoConferenceProperties, VideoConferenceDO } from '@shared/domain';
import { TargetModels, VideoConference } from '@shared/domain/entity/video-conference.entity';
import { VideoConferenceScope } from '@shared/domain/interface';
import { BaseDORepo } from '@shared/repo/base.do.repo';
import { EntityName } from '@mikro-orm/core';

const TargetModelsMapping = {
	[VideoConferenceScope.EVENT]: TargetModels.EVENTS,
	[VideoConferenceScope.COURSE]: TargetModels.COURSES,
};

const VideoConferencingScopeMapping = {
	[TargetModels.EVENTS]: VideoConferenceScope.EVENT,
	[TargetModels.COURSES]: VideoConferenceScope.COURSE,
};

@Injectable()
export class VideoConferenceRepo extends BaseDORepo<VideoConferenceDO, VideoConference, IVideoConferenceProperties> {
	get entityName(): EntityName<VideoConference> {
		return VideoConference;
	}

	entityFactory(props: IVideoConferenceProperties): VideoConference {
		return new VideoConference(props);
	}

	async findByScopeId(target: string, videoConferenceScope: VideoConferenceScope): Promise<VideoConferenceDO> {
		const entity = await this._em.findOneOrFail(VideoConference, {
			target,
			targetModel: TargetModelsMapping[videoConferenceScope],
		});

		return this.mapEntityToDO(entity);
	}

	protected mapEntityToDO(entity: VideoConference): VideoConferenceDO {
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

	protected mapDOToEntityProperties(entityDO: VideoConferenceDO): IVideoConferenceProperties {
		return {
			target: entityDO.target,
			targetModel: TargetModelsMapping[entityDO.targetModel],
			options: {
				everybodyJoinsAsModerator: entityDO.options.everybodyJoinsAsModerator,
				everyAttendeJoinsMuted: entityDO.options.everyAttendeeJoinsMuted,
				moderatorMustApproveJoinRequests: entityDO.options.moderatorMustApproveJoinRequests,
			},
		};
	}
}
