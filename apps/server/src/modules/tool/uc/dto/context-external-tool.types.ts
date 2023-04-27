import { ContextExternalToolDO } from '@shared/domain/domainobject/tool/context-external-tool.do';

export type ContextExternalTool = ContextExternalToolDO;

export type ContextExternalToolQuery = Partial<Pick<ContextExternalTool, 'schoolToolId'>>;
