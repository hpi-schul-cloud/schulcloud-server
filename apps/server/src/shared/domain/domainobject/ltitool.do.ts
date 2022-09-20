import { BaseWithTimestampsDO } from './base.do';

export class LtiToolDO extends BaseWithTimestampsDO {
	name: string;

	oAuthClientId?: string;

	isLocal?: boolean;

	constructor(props: LtiToolDO) {
		super(props);
		this.name = props.name;
		this.oAuthClientId = props.oAuthClientId;
		this.isLocal = props.isLocal;
	}
}
