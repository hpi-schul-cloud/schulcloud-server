import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';

export type SchoolExternalTool = SchoolExternalToolDO;

export type SchoolExternalToolQueryInput = Partial<Pick<SchoolExternalToolDO, 'schoolId'>>;

export type SchoolExternalToolQuery = Partial<Pick<SchoolExternalToolDO, 'schoolId'>>;
