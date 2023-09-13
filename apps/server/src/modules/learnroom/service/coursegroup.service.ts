import { Injectable } from '@nestjs/common';
import { CourseGroup, EntityId } from '@shared/domain';
import { CourseGroupRepo } from '@shared/repo';

@Injectable()
export class CourseGroupService {
	constructor(private readonly repo: CourseGroupRepo) {}

	public async deleteUserDataFromCourseGroup(userId: EntityId): Promise<number> {
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		const updatedCourseGroups = courseGroups.map(
			(courseGroup: CourseGroup) =>
				({
					...courseGroup,
					students: courseGroup.removeStudent(userId),
				} as unknown as CourseGroup)
		);

		await this.repo.save(updatedCourseGroups);

		return count;
	}
}
