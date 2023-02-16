import { CustomParameterEntryDO } from './custom-parameter-entry.do';
import { BaseDO } from '../base.do';

export class CourseExternalToolDO extends BaseDO {
	createdAt?: Date;

	updatedAt?: Date;

	schoolToolId: string;

	courseId: string;

	parameters: CustomParameterEntryDO[];

	toolVersion: number;

	constructor(domainObject: CourseExternalToolDO) {
		super(domainObject.id);

		this.createdAt = domainObject.createdAt;
		this.updatedAt = domainObject.updatedAt;
		this.schoolToolId = domainObject.schoolToolId;
		this.courseId = domainObject.courseId;
		this.parameters = domainObject.parameters;
		this.toolVersion = domainObject.toolVersion;
	}
}
