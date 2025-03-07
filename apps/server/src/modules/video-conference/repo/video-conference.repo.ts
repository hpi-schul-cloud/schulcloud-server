import { EntityData, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseDORepo } from '@shared/repo/base.do.repo';
import { VideoConferenceDO, VideoConferenceOptionsDO, VideoConferenceScope } from '../domain';
import { VideoConferenceTargetModels } from './video-conference-target-models.enum';
import { VideoConferenceEntity } from './video-conference.entity';

const VideoConferenceTargetModelsMapping: Record<VideoConferenceScope, VideoConferenceTargetModels> = {
	[VideoConferenceScope.EVENT]: VideoConferenceTargetModels.EVENTS,
	[VideoConferenceScope.COURSE]: VideoConferenceTargetModels.COURSES,
	[VideoConferenceScope.ROOM]: VideoConferenceTargetModels.ROOMS,
	[VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT]: VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS,
};

const VideoConferencingScopeMapping: Record<VideoConferenceTargetModels, VideoConferenceScope> = {
	[VideoConferenceTargetModels.EVENTS]: VideoConferenceScope.EVENT,
	[VideoConferenceTargetModels.COURSES]: VideoConferenceScope.COURSE,
	[VideoConferenceTargetModels.ROOMS]: VideoConferenceScope.ROOM,
	[VideoConferenceTargetModels.VIDEO_CONFERENCE_ELEMENTS]: VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT,
};

@Injectable()
export class VideoConferenceRepo extends BaseDORepo<VideoConferenceDO, VideoConferenceEntity> {
	get entityName(): EntityName<VideoConferenceEntity> {
		return VideoConferenceEntity;
	}

	public async findByScopeAndScopeId(
		scopeId: string,
		videoConferenceScope: VideoConferenceScope
	): Promise<VideoConferenceDO> {
		const entity: VideoConferenceEntity = await this._em.findOneOrFail(VideoConferenceEntity, {
			target: scopeId,
			targetModel: VideoConferenceTargetModelsMapping[videoConferenceScope],
		});

		return this.mapEntityToDO(entity);
	}

	protected mapEntityToDO(entity: VideoConferenceEntity): VideoConferenceDO {
		return new VideoConferenceDO({
			id: entity.id,
			target: entity.target,
			targetModel: VideoConferencingScopeMapping[entity.targetModel],
			options: new VideoConferenceOptionsDO({
				everybodyJoinsAsModerator: entity.options.everybodyJoinsAsModerator,
				everyAttendeeJoinsMuted: entity.options.everyAttendeJoinsMuted,
				moderatorMustApproveJoinRequests: entity.options.moderatorMustApproveJoinRequests,
			}),
		});
	}

	protected mapDOToEntityProperties(entityDO: VideoConferenceDO): EntityData<VideoConferenceEntity> {
		return {
			target: entityDO.target,
			targetModel: VideoConferenceTargetModelsMapping[entityDO.targetModel],
			options: {
				everybodyJoinsAsModerator: entityDO.options.everybodyJoinsAsModerator,
				everyAttendeJoinsMuted: entityDO.options.everyAttendeeJoinsMuted,
				moderatorMustApproveJoinRequests: entityDO.options.moderatorMustApproveJoinRequests,
			},
		};
	}
}
