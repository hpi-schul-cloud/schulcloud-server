import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntity, BaseEntityWithTimestamps } from './base.entity';

export enum TargetModels {
	COURSES = 'courses',
	EVENTS = 'events',
}

export class VideoConferenceOptions {
	everyAttendeJoinsMuted: boolean;

	everybodyJoinsAsModerator: boolean;

	moderatorMustApproveJoinRequests: boolean;

	constructor(options: VideoConferenceOptions) {
		this.everyAttendeJoinsMuted = options.everyAttendeJoinsMuted;
		this.everybodyJoinsAsModerator = options.everybodyJoinsAsModerator;
		this.moderatorMustApproveJoinRequests = options.moderatorMustApproveJoinRequests;
	}
}

export type IVideoConferenceProperties = Readonly<Omit<VideoConference, keyof BaseEntityWithTimestamps>>;

// Preset options for opening a video conference
@Entity({ tableName: 'videoconferences' })
@Index({ properties: ['target', 'targetModel'] })
export class VideoConference extends BaseEntityWithTimestamps {
	@Property()
	@Index()
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
