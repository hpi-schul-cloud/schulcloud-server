import { ContextExternalToolProps, ContextRef } from '../../domainobject';
import { SchoolExternalToolRefDO } from '../../../school-external-tool/domainobject';

export type ContextExternalTool = ContextExternalToolProps;

export type ContextExternalToolQuery = {
	id?: string;
	schoolToolRef?: Partial<SchoolExternalToolRefDO>;
	context?: Partial<ContextRef>;
};
