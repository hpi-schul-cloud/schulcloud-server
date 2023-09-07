import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CourseGroup, EntityId } from '@shared/domain';
import { CourseGroupRepo } from '@shared/repo';

@Injectable()
export class CourseGroupService {
	constructor(private readonly repo: CourseGroupRepo) {}

	public async deleteUserDataFromCourseGroup(userId: EntityId): Promise<number> {
		if (!userId) {
			throw new InternalServerErrorException('User id is missing');
		}

		const [courseGroups, count] = await this.repo.findByUserId(userId);

		const updatedCourseGroups = courseGroups.map(
			(courseGroup: CourseGroup) =>
				({
					...courseGroup,
					students: courseGroup.students.remove((u) => u.id !== userId),
				} as unknown as CourseGroup)
		);

		await this.repo.save(updatedCourseGroups);

		return count;
	}
}
