import { SchoolExternalToolProps } from '@shared/domain/domainobject/tool/school-external-tool.do';

export type SchoolExternalTool = SchoolExternalToolProps;

export type SchoolExternalToolQueryInput = {
	schoolId?: string;
	toolId?: string;
};

export type SchoolExternalToolQuery = {
	schoolId?: string;
	toolId?: string;
};
