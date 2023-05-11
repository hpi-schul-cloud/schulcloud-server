import { CustomParameterEntryDO } from './custom-parameter-entry.do';
import { BaseDO } from '../base.do';
import { SchoolExternalToolStatus } from './school-external-tool-status';

export class SchoolExternalToolDO extends BaseDO {
	name?: string;

	toolId: string;

	schoolId: string;

	parameters: CustomParameterEntryDO[];

	toolVersion: number;

	status?: SchoolExternalToolStatus;

	constructor(domainObject: SchoolExternalToolDO) {
		super(domainObject.id);
		this.name = domainObject.name;
		this.toolId = domainObject.toolId;
		this.schoolId = domainObject.schoolId;
		this.parameters = domainObject.parameters;
		this.toolVersion = domainObject.toolVersion;
		this.status = domainObject.status;
	}
}
