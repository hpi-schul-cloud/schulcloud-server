import { SchoolExternalToolRef } from '../../../school-external-tool/domain';
import { ContextExternalToolProps, ContextRef } from '../../domain';

export type ContextExternalToolDto = ContextExternalToolProps;

export type ContextExternalToolQuery = {
	id?: string;
	schoolToolRef?: Partial<Omit<SchoolExternalToolRef, 'schoolId'>>;
	context?: Partial<ContextRef>;
};
