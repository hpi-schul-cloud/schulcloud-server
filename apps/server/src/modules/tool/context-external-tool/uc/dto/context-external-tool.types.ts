import { ContextExternalToolProps, ContextRef } from '../../domain';
import { SchoolExternalToolRefDO } from '../../../school-external-tool/domain';

export type ContextExternalTool = ContextExternalToolProps;

export type ContextExternalToolQuery = {
	id?: string;
	schoolToolRef?: Partial<SchoolExternalToolRefDO>;
	context?: Partial<ContextRef>;
};
