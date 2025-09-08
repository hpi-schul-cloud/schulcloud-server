import { CustomParameterEntry } from '../../common/domain';

export class LtiDeepLink {
	mediaType: string;

	url?: string;

	title?: string;

	text?: string;

	parameters: CustomParameterEntry[];

	availableFrom?: Date;

	availableUntil?: Date;

	submissionFrom?: Date;

	submissionUntil?: Date;

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
