import { CustomParameterEntryDO } from './custom-parameter-entry.do';
import { BaseWithTimestampsDO } from '../base.do';

export class SchoolExternalToolDO extends BaseWithTimestampsDO {
	toolId: string;

	schoolId: string;

	parameters: CustomParameterEntryDO[];

	toolVersion: number;

	constructor(props: SchoolExternalToolDO) {
		super(props);
		this.toolId = props.toolId;
		this.schoolId = props.schoolId;
		this.parameters = props.parameters;
		this.toolVersion = props.toolVersion;
	}
}
