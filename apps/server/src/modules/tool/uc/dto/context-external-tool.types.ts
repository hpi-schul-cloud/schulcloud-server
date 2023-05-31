import { ContextExternalToolDO } from '@shared/domain/domainobject/tool/context-external-tool.do';
import { SchoolExternalToolRefDO } from '@shared/domain';

export type ContextExternalTool = ContextExternalToolDO;

export type ContextExternalToolQuery = {
	id?: string;
	schoolToolRef?: Partial<SchoolExternalToolRefDO>;
	contextId?: ContextExternalTool['contextId'];
};
