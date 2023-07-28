import { SchoolExternalToolProps } from '../../domainobject';

export type SchoolExternalTool = SchoolExternalToolProps;

export type SchoolExternalToolQueryInput = {
	schoolId?: string;
	toolId?: string;
};

export type SchoolExternalToolQuery = {
	schoolId?: string;
	toolId?: string;
};
