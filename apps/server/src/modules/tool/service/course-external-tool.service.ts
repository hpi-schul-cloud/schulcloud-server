import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { CourseExternalToolRepo } from '@shared/repo/courseexternaltool/course-external-tool.repo';
import { CourseExternalToolDO } from '@shared/domain/domainobject/external-tool/course-external-tool.do';

@Injectable()
export class CourseExternalToolService {
	constructor(private readonly courseExternalToolRepo: CourseExternalToolRepo) {}

	async deleteBySchoolExternalToolId(schoolExternalToolId: EntityId) {
		const courseExternalTools: CourseExternalToolDO[] = await this.courseExternalToolRepo.find({
			schoolToolId: schoolExternalToolId,
		});
		await this.courseExternalToolRepo.delete(courseExternalTools);
	}
}
