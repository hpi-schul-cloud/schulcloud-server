import { Injectable } from '@nestjs/common';
import { VideoconferenceRepo } from '@shared/repo/videoconference';
import { TargetModels, VideoConference } from '@shared/domain/entity/video-conference.entity';
import { VideoConferenceScope } from '@shared/domain/interface/vc-scope.enum';
import { VideoConferenceOptions } from '@src/modules/video-conference/interface/vc-options.interface';
import { VideoConferenceDO } from '@shared/domain';

const TargetModelMapping = {
	[VideoConferenceScope.EVENT]: TargetModels.EVENTS,
	[VideoConferenceScope.COURSE]: TargetModels.COURSES,
};

@Injectable()
export class VideoConferenceService {
	constructor(private readonly vcRepo: VideoconferenceRepo) {}

	/**
	 * Gets the options selected for a video conference
	 * @param {string} target eventId or courseId, depending on scope
	 * @param {VideoConferenceScope} conferenceScope
	 */
	async get(target: string, conferenceScope: VideoConferenceScope): Promise<VideoConferenceOptions> {
		const targetModel: TargetModels = TargetModelMapping[conferenceScope];
		const vcDO: VideoConferenceDO = await this.vcRepo.findByScopeId(target, targetModel);
		return vcDO.options;
	}

	/**
	 * Saves a preset for the selected options
	 * @param {string} target eventId or courseId, depending on scope
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {VideoConferenceOptions} options
	 */
	async create(target: string, conferenceScope: VideoConferenceScope, options: VideoConferenceOptions): Promise<void> {
		const targetModel: TargetModels = TargetModelMapping[conferenceScope];
		const entity = this.vcRepo.create(
			new VideoConference({
				target,
				targetModel,
				options: {
					everyAttendeJoinsMuted: options.everyAttendeeJoinsMuted,
					everybodyJoinsAsModerator: options.everybodyJoinsAsModerator,
					moderatorMustApproveJoinRequests: options.moderatorMustApproveJoinRequests,
				},
			})
		);

		await this.vcRepo.save(entity);
	}
}
