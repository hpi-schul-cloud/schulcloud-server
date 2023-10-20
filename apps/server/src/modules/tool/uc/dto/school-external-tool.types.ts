import { SchoolExternalToolProps } from '@shared/domain/domainobject/tool/school-external-tool.do';

export type SchoolExternalTool = SchoolExternalToolProps;

export type SchoolExternalToolQueryInput = Partial<Pick<SchoolExternalToolProps, 'schoolId'>>;

export type SchoolExternalToolQuery = Partial<Pick<SchoolExternalToolProps, 'schoolId'>>;
