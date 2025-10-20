import { Embedded, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { VideoConferenceOptions } from './video-conference-options.embeddable';
import { VideoConferenceTargetModels } from './video-conference-target-models.enum';

export type VideoConferenceProps = {
	target: string;

	targetModel: VideoConferenceTargetModels;

	options: VideoConferenceOptions;
};

// Preset options for opening a video conference
@Entity({ tableName: 'videoconferences' })
@Index({ properties: ['target', 'targetModel'] })
export class VideoConferenceEntity extends BaseEntityWithTimestamps {
	@Property()
	@Index()
	target: string;

	@Enum(() => VideoConferenceTargetModels)
	targetModel: VideoConferenceTargetModels;

	@Embedded(() => VideoConferenceOptions, { object: true })
	options: VideoConferenceOptions;

	constructor(props: VideoConferenceProps) {
		super();
		this.target = props.target;
		this.targetModel = props.targetModel;
		this.options = props.options;
	}
}
