import { CourseExternalToolDO } from '@shared/domain/domainobject/external-tool/course-external-tool.do';
import { CustomParameterEntryDO } from '@shared/domain/domainobject/external-tool/custom-parameter-entry.do';
import { DeepPartial } from 'fishery';
import { DoBaseFactory } from './do-base.factory';

class CourseExternalToolDOFactory extends DoBaseFactory<CourseExternalToolDO, CourseExternalToolDO> {
	withSchoolToolId(schoolToolId: string): this {
		const params: DeepPartial<CourseExternalToolDO> = {
			schoolToolId,
		};
		return this.params(params);
	}
}

export const courseExternalToolDOFactory = CourseExternalToolDOFactory.define(CourseExternalToolDO, ({ sequence }) => {
	return {
		displayName: 'My Course Tool 1',
		courseId: `courseId-${sequence}`,
		parameters: [new CustomParameterEntryDO({ name: 'param', value: 'value' })],
		schoolToolId: `schoolToolId-${sequence}`,
		toolVersion: 1,
	};
});
