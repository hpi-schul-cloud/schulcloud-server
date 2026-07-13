import { type CustomParameterEntry } from '../../common/domain';

export class LtiDeepLink {
	public mediaType: string;

	public url?: string;

	public title?: string;

	public text?: string;

	public parameters: CustomParameterEntry[];

	public availableFrom?: Date;

	public availableUntil?: Date;

	public submissionFrom?: Date;

	public submissionUntil?: Date;

	constructor(props: LtiDeepLink) {
		this.mediaType = props.mediaType;
		this.url = props.url;
		this.title = props.title;
		this.text = props.text;
		this.parameters = props.parameters;
		this.availableFrom = props.availableFrom;
		this.availableUntil = props.availableUntil;
		this.submissionFrom = props.submissionFrom;
		this.submissionUntil = props.submissionUntil;
	}
}
