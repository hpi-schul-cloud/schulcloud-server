import { LaunchRequestMethod } from './launch-request-method';

export class ToolLaunchRequestDO {
	method!: LaunchRequestMethod;

	url!: string;

	payload: string;

	constructor(props: ToolLaunchRequestDO) {
		this.url = props.url;
		this.method = props.method;
		this.payload = props.payload;
	}
}
