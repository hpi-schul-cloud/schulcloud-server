import { SchoolExternalToolProps } from '../../domain';

export type SchoolExternalToolDto = SchoolExternalToolProps;

export type SchoolExternalToolQueryInput = {
	schoolId?: string;
	toolId?: string;
};

export type SchoolExternalToolQuery = {
	schoolId?: string;
	toolId?: string;
	isDeactivated?: boolean;
};
