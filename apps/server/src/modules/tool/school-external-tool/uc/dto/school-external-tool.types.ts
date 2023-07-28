import { SchoolExternalToolProps } from '../../domain';

export type SchoolExternalToolDTO = SchoolExternalToolProps;

export type SchoolExternalToolQueryInput = {
	schoolId?: string;
	toolId?: string;
};

export type SchoolExternalToolQuery = {
	schoolId?: string;
	toolId?: string;
};
