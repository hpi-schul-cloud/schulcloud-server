import { CustomParameterEntry } from '../../common/domain';

export class LtiDeepLink {
	mediaType: string;

	url?: string;

	title?: string;

	parameters: CustomParameterEntry[];

	constructor(props: LtiDeepLink) {
		this.mediaType = props.mediaType;
		this.url = props.url;
		this.title = props.title;
		this.parameters = props.parameters;
	}
}
