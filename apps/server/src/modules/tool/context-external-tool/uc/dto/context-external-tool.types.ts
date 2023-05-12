import { ContextExternalToolDO } from '@shared/domain';

export type ContextExternalTool = ContextExternalToolDO;

export type ContextExternalToolQuery = Partial<Pick<ContextExternalTool, 'schoolToolId' | 'contextId'>>;
