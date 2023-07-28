import { ContextExternalToolProps, ContextRef } from '../../domain';
import { SchoolExternalToolRefDO } from '../../../school-external-tool/domain';

export type ContextExternalToolDto = ContextExternalToolProps;

export type ContextExternalToolQuery = {
	id?: string;
	schoolToolRef?: Partial<SchoolExternalToolRefDO>;
	context?: Partial<ContextRef>;
};
