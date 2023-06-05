import { ToolContextType } from '@src/modules/tool/interface';
import { BaseDO } from '../base.do';
import { CustomParameterEntryDO } from './custom-parameter-entry.do';
import { SchoolExternalToolRefDO } from './school-external-tool-ref.do';

export class ContextExternalToolDO extends BaseDO {
	schoolToolRef: SchoolExternalToolRefDO;

	contextId: string;

	contextType: ToolContextType;

	displayName?: string;

	parameters: CustomParameterEntryDO[];

	toolVersion: number;

	constructor(domainObject: ContextExternalToolDO) {
		super(domainObject.id);
		this.schoolToolRef = domainObject.schoolToolRef;
		this.contextId = domainObject.contextId;
		this.contextType = domainObject.contextType;
		this.displayName = domainObject.displayName;
		this.parameters = domainObject.parameters;
		this.toolVersion = domainObject.toolVersion;
	}
}
