import { CustomParameterEntry } from '../../common/domain';

export class LtiDeepLink {
	title?: string;

	parameters: CustomParameterEntry[];

	constructor(props: LtiDeepLink) {
		this.title = props.title;
		this.parameters = props.parameters;
	}
}
