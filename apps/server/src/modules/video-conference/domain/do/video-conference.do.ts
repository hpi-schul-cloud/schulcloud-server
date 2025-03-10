import { BaseDO } from '@shared/domain/domainobject/base.do';
import { VideoConferenceScope } from '../type';
import { VideoConferenceOptionsDO } from './video-conference-options.do';

export class VideoConferenceDO extends BaseDO {
	public target: string;

	public targetModel: VideoConferenceScope;

	public options: VideoConferenceOptionsDO;

	constructor(domainObject: VideoConferenceDO) {
		super(domainObject.id);

		this.target = domainObject.target;
		this.targetModel = domainObject.targetModel;
		this.options = domainObject.options;
	}
}
