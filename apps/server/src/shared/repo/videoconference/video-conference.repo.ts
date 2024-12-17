import { EntityData, EntityName, Loaded } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { VideoConferenceDO } from '@shared/domain/domainobject';
import { TargetModels, VideoConference } from '@shared/domain/entity/video-conference.entity';
import { VideoConferenceScope } from '@shared/domain/interface';
import { BaseDORepo } from '@shared/repo/base.do.repo';

const TargetModelsMapping = {
	[VideoConferenceScope.EVENT]: TargetModels.EVENTS,
	[VideoConferenceScope.COURSE]: TargetModels.COURSES,
	[VideoConferenceScope.ROOM]: TargetModels.ROOMS,
	[VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT]: TargetModels.VIDEO_CONFERENCE_ELEMENTS,
};

const VideoConferencingScopeMapping = {
	[TargetModels.EVENTS]: VideoConferenceScope.EVENT,
	[TargetModels.COURSES]: VideoConferenceScope.COURSE,
	[TargetModels.ROOMS]: VideoConferenceScope.ROOM,
	[TargetModels.VIDEO_CONFERENCE_ELEMENTS]: VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT,
};

@Injectable()
export class VideoConferenceRepo extends BaseDORepo<VideoConferenceDO, VideoConference> {
	get entityName(): EntityName<VideoConference> {
		return VideoConference;
	}

	async findByScopeAndScopeId(scopeId: string, videoConferenceScope: VideoConferenceScope): Promise<VideoConferenceDO> {
		const entity: Loaded<VideoConference> = await this._em.findOneOrFail(VideoConference, {
			target: scopeId,
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

	protected mapDOToEntityProperties(entityDO: VideoConferenceDO): EntityData<VideoConference> {
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
