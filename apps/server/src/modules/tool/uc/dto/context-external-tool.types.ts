import { ContextExternalToolDO } from '@shared/domain/domainobject/tool/context-external-tool.do';
import { ContextRef, SchoolExternalToolRefDO } from '@shared/domain';

export type ContextExternalTool = ContextExternalToolDO;

export type ContextExternalToolQuery = {
	id?: string;
	schoolToolRef?: Partial<SchoolExternalToolRefDO>;
	context?: Partial<ContextRef>;
};
