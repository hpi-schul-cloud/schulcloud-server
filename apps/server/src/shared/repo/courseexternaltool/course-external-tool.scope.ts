import { Scope } from '@shared/repo';
import { CourseExternalTool, EntityId } from '@shared/domain';

export class CourseExternalToolScope extends Scope<CourseExternalTool> {
	bySchoolToolId(schoolToolId: EntityId | undefined): CourseExternalToolScope {
		if (schoolToolId !== undefined) {
			this.addQuery({ schoolTool: schoolToolId });
		}
		return this;
	}
}
