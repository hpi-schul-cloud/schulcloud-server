import { BaseDO } from '../base.do';
import { CustomParameterEntryDO } from './custom-parameter-entry.do';
import { SchoolExternalToolRefDO } from './school-external-tool-ref.do';
import { ContextRef } from './context-ref';

export class ContextExternalToolDO extends BaseDO {
	schoolToolRef: SchoolExternalToolRefDO;

	contextRef: ContextRef;

	contextToolName: string;

	parameters: CustomParameterEntryDO[];

	toolVersion: number;

	createdAt?: Date;

	updatedAt?: Date;

	constructor(domainObject: ContextExternalToolDO) {
		super(domainObject.id);
		this.schoolToolRef = domainObject.schoolToolRef;
		this.contextRef = domainObject.contextRef;
		this.contextToolName = domainObject.contextToolName;
		this.parameters = domainObject.parameters;
		this.toolVersion = domainObject.toolVersion;
		this.createdAt = domainObject.createdAt;
		this.updatedAt = domainObject.updatedAt;
	}
}
