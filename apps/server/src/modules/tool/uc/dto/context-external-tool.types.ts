import { ContextExternalToolProps } from '@shared/domain/domainobject/tool/context-external-tool.do';
import { ContextRef, SchoolExternalToolRefDO } from '@shared/domain';

export type ContextExternalTool = ContextExternalToolProps;

export type ContextExternalToolQuery = {
	id?: string;
	schoolToolRef?: Partial<SchoolExternalToolRefDO>;
	context?: Partial<ContextRef>;
};
