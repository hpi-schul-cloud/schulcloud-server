import { BaseWithTimestampsDO } from './base.do';

export class LtiToolDO extends BaseWithTimestampsDO {
	name: string;

	constructor(props: LtiToolDO) {
		super(props);
		this.name = props.name;
	}
}
