import { Injectable } from '@nestjs/common';
import { Counted, CourseGroup, EntityId } from '@shared/domain';
import { CourseGroupRepo } from '@shared/repo';

@Injectable()
export class CourseGroupService {
	constructor(private readonly repo: CourseGroupRepo) {}

	public async findAllCourseGroupsByUserId(userId: EntityId): Promise<Counted<CourseGroup[]>> {
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		return [courseGroups, count];
	}

	public async deleteUserDataFromCourseGroup(userId: EntityId): Promise<number> {
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		courseGroups.forEach((courseGroup) => courseGroup.removeStudent(userId));

		await this.repo.save(courseGroups);

		return count;
	}
}
