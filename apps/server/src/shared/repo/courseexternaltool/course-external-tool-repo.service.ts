import { BaseRepo } from '@shared/repo';
import { CourseExternalTool, EntityId } from '@shared/domain';
import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ObjectId } from '@mikro-orm/mongodb';

@Injectable()
export class CourseExternalToolRepo extends BaseRepo<CourseExternalTool> {
	get entityName(): EntityName<CourseExternalTool> {
		return CourseExternalTool;
	}

	async findBySchoolToolIdAndCourseId(schoolToolId: EntityId, courseId: EntityId): Promise<CourseExternalTool | null> {
		return this._em.findOne(CourseExternalTool, {
			schoolTool: new ObjectId(schoolToolId),
			course: new ObjectId(courseId),
		});
	}

	async findAllBySchoolToolId(schoolToolId: EntityId): Promise<CourseExternalTool[]> {
		return this._em.find(CourseExternalTool, { schoolTool: new ObjectId(schoolToolId) });
	}

	async findAllByCourseId(courseId: EntityId): Promise<CourseExternalTool[]> {
		return this._em.find(CourseExternalTool, { course: new ObjectId(courseId) });
	}
}
