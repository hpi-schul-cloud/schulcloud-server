import { CourseExternalToolDO } from '@shared/domain/domainobject/external-tool/course-external-tool.do';

export type CourseExternalToolQueryInput = Partial<Pick<CourseExternalToolDO, 'schoolToolId'>>;

export type CourseExternalToolQuery = Partial<Pick<CourseExternalToolDO, 'schoolToolId'>>;
