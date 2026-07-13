import { type LaunchRequestMethod } from './launch-request-method';
import { type LaunchType } from './launch-type.enum';

export class ToolLaunchRequest {
	public method: LaunchRequestMethod;

	public url: string;

	public payload?: string;

	public openNewTab: boolean;

	public launchType: LaunchType;

	constructor(props: ToolLaunchRequest) {
		this.url = props.url;
		this.method = props.method;
		this.payload = props.payload;
		this.openNewTab = props.openNewTab;
		this.launchType = props.launchType;
	}
}
