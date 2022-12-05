import { CustomParameterEntryDO } from './custom-parameter-entry.do';
import { BaseWithTimestampsDO } from '../base.do';

export class CourseExternalToolDO extends BaseWithTimestampsDO {
	schoolToolId: string;

	courseId: string;

	parameters: CustomParameterEntryDO[];

	toolVersion: number;

	constructor(props: CourseExternalToolDO) {
		super(props);
		this.schoolToolId = props.schoolToolId;
		this.courseId = props.courseId;
		this.parameters = props.parameters;
		this.toolVersion = props.toolVersion;
	}
}
