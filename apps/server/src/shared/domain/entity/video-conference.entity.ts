import { BaseEntityWithTimestamps } from '@shared/domain';
import { Entity, Index, Property } from '@mikro-orm/core';

export enum TargetModels {
	COURSES = 'courses',
	EVENTS = 'events',
}

export class VideoConferenceOptions {
	moderatorMustApproveJoinRequests: boolean;

	everybodyJoinsAsModerator: boolean;

	everyAttendeeJoinsMuted: boolean; // TODO migration from everyAttendeJoinsMuted to everyAttendeeJoinsMuted

	constructor(options: VideoConferenceOptions) {
		this.moderatorMustApproveJoinRequests = options.moderatorMustApproveJoinRequests;
		this.everybodyJoinsAsModerator = options.everybodyJoinsAsModerator;
		this.everyAttendeeJoinsMuted = options.everyAttendeeJoinsMuted;
	}
}

export type IVideoConferenceProperties = Readonly<Omit<VideoConference, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'videoconferences' })
@Index({ properties: 'target' })
@Index({ properties: ['target', 'targetModel'] })
export class VideoConference extends BaseEntityWithTimestamps {
	@Property()
	target: string;

	@Property()
	targetModel: TargetModels;

	@Property()
	options: VideoConferenceOptions;

	constructor(props: IVideoConferenceProperties) {
		super();
		this.target = props.target;
		this.targetModel = props.targetModel;
		this.options = props.options;
	}
}
