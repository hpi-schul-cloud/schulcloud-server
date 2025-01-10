import { LaunchRequestMethod } from './launch-request-method';
import { LaunchType } from './launch-type.enum';

export class ToolLaunchRequest {
	method: LaunchRequestMethod;

	url: string;

	payload?: string;

	openNewTab: boolean;

	launchType: LaunchType;

	constructor(props: ToolLaunchRequest) {
		this.url = props.url;
		this.method = props.method;
		this.payload = props.payload;
		this.openNewTab = props.openNewTab;
		this.launchType = props.launchType;
	}
}
