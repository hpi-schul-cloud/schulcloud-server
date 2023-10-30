import { SchoolExternalToolRefDO } from '@src/modules/tool/school-external-tool/domain/school-external-tool-ref.do';
import { ContextExternalToolProps } from '../../domain/context-external-tool.do';
import { ContextRef } from '../../domain/context-ref';

export type ContextExternalToolDto = ContextExternalToolProps;

export type ContextExternalToolQuery = {
	id?: string;
	schoolToolRef?: Partial<SchoolExternalToolRefDO>;
	context?: Partial<ContextRef>;
};
