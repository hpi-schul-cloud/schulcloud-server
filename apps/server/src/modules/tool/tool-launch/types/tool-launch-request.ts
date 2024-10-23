import { LaunchRequestMethod } from './launch-request-method';

export class ToolLaunchRequest {
	method: LaunchRequestMethod;

	url: string;

	payload?: string;

	openNewTab: boolean;

	isDeepLink: boolean;

	constructor(props: ToolLaunchRequest) {
		this.url = props.url;
		this.method = props.method;
		this.payload = props.payload;
		this.openNewTab = props.openNewTab;
		this.isDeepLink = props.openNewTab;
	}
}
