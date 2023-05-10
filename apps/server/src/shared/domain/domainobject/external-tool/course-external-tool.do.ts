import { BaseDO } from '../base.do';
import { CustomParameterEntryDO } from './custom-parameter-entry.do';

export class CourseExternalToolDO extends BaseDO {
	displayName?: string;

	schoolToolId: string;

	courseId: string;

	parameters: CustomParameterEntryDO[];

	toolVersion: number;

	constructor(domainObject: CourseExternalToolDO) {
		super(domainObject.id);

		this.displayName = domainObject.displayName;
		this.schoolToolId = domainObject.schoolToolId;
		this.courseId = domainObject.courseId;
		this.parameters = domainObject.parameters;
		this.toolVersion = domainObject.toolVersion;
	}
}
