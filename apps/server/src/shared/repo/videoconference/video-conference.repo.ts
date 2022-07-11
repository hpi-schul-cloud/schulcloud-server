import { Injectable } from '@nestjs/common';
import { VideoConferenceDO } from '@shared/domain';
import { TargetModels, VideoConference } from '@shared/domain/entity/video-conference.entity';
import { VideoConferenceScope } from '@shared/domain/interface/vc-scope.enum';
import { BaseDORepo } from '@shared/repo/base.do.repo';

const TargetModelsMapping = {
	[VideoConferenceScope.EVENT]: TargetModels.EVENTS,
	[VideoConferenceScope.COURSE]: TargetModels.COURSES,
};

const VideoConferencingScopeMapping = {
	[TargetModels.EVENTS]: VideoConferenceScope.EVENT,
	[TargetModels.COURSES]: VideoConferenceScope.COURSE,
};

@Injectable()
export class VideoConferenceRepo extends BaseDORepo<VideoConferenceDO, VideoConference> {
	get entityName() {
		return VideoConference;
	}

	cacheExpiration = 60000;

	async findByScopeId(target: string, targetModel: TargetModels): Promise<VideoConferenceDO> {
		const entity = await this._em.findOneOrFail(
			VideoConference,
			{ target, targetModel },
			{ cache: this.cacheExpiration }
		);

		return this.mapEntityToDO(entity);
	}

	mapEntityToDO(entity: VideoConference): VideoConferenceDO {
		return new VideoConferenceDO({
			id: entity.id,
			target: entity.target,
			targetModel: VideoConferencingScopeMapping[entity.targetModel],
			options: entity.options
				? {
						everybodyJoinsAsModerator: entity.options.everybodyJoinsAsModerator,
						everyAttendeeJoinsMuted: entity.options.everyAttendeJoinsMuted,
						moderatorMustApproveJoinRequests: entity.options.moderatorMustApproveJoinRequests,
				  }
				: undefined,
		});
	}

	mapDOToEntity(entityDO: VideoConferenceDO): VideoConference {
		return new VideoConference({
			target: entityDO.target,
			targetModel: TargetModelsMapping[entityDO.targetModel],
			options: entityDO.options
				? {
						everybodyJoinsAsModerator: entityDO.options.everybodyJoinsAsModerator,
						everyAttendeJoinsMuted: entityDO.options.everyAttendeeJoinsMuted,
						moderatorMustApproveJoinRequests: entityDO.options.moderatorMustApproveJoinRequests,
				  }
				: undefined,
		});
	}
}
