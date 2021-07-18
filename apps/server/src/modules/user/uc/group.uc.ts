import { Injectable } from '@nestjs/common';
import { EntityId, PermissionsTypes } from '@shared/domain';
import { GroupRepo } from '../repo';
import { UserGroupTypes, FilteredCourseGroups } from '../entity';

@Injectable()
export class GroupUC {
	constructor(private readonly groupRepo: GroupRepo) {}

	async getCourseGroupsByUserId(userId: EntityId): Promise<FilteredCourseGroups> {
		const [courseGroups, coursegroupGroups] = await Promise.all([
			this.groupRepo.getCoursesByUserId(userId),
			this.groupRepo.getCourseGroupsByUserId(userId),
		]);

		const sortedGroupcollections = new FilteredCourseGroups();

		coursegroupGroups.forEach(({ studentIds, parent }) => {
			const type = UserGroupTypes.CoursegroupStudents;
			sortedGroupcollections[type].push({
				userIds: studentIds,
				type,
				parent,
				permission: PermissionsTypes.Read,
			});
		});

		courseGroups.forEach(({ teacherIds, studentIds, substitutionIds, id }) => {
			const studentType = UserGroupTypes.CourseStudents;
			const teacherType = UserGroupTypes.CourseTeachers;
			const substitionTeacherType = UserGroupTypes.CourseSubstitutionTeachers;

			sortedGroupcollections[studentType].push({
				userIds: studentIds,
				type: studentType,
				parent: id,
				permission: PermissionsTypes.Read,
			});

			sortedGroupcollections[teacherType].push({
				userIds: teacherIds,
				type: teacherType,
				parent: id,
				permission: PermissionsTypes.Write,
			});

			sortedGroupcollections[studentType].push({
				userIds: substitutionIds,
				type: substitionTeacherType,
				parent: id,
				permission: PermissionsTypes.Write,
			});
		});

		return sortedGroupcollections;
	}
}
