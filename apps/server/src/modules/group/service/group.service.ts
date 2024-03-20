import { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { Course } from '@modules/learnroom/domain';
import { CourseService } from '@modules/learnroom/service/course.service';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { type UserDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Group, GroupTypes } from '../domain';
import { GroupRepo } from '../repo';

@Injectable()
export class GroupService implements AuthorizationLoaderServiceGeneric<Group> {
	constructor(private readonly groupRepo: GroupRepo, private readonly courseService: CourseService) {}

	public async findById(id: EntityId): Promise<Group> {
		const group: Group | null = await this.groupRepo.findGroupById(id);

		if (!group) {
			throw new NotFoundLoggableException(Group.name, { id });
		}

		return group;
	}

	public async tryFindById(id: EntityId): Promise<Group | null> {
		const group: Group | null = await this.groupRepo.findGroupById(id);

		return group;
	}

	public async findByExternalSource(externalId: string, systemId: EntityId): Promise<Group | null> {
		const group: Group | null = await this.groupRepo.findByExternalSource(externalId, systemId);

		return group;
	}

	public async findGroupsByUserAndGroupTypes(
		user: UserDO,
		skip?: number,
		limit?: number,
		groupTypes?: GroupTypes[]
	): Promise<Group[]> {
		const groups: Group[] = await this.groupRepo.findByUserAndGroupTypes(user, skip, limit, groupTypes);

		return groups;
	}

	public async findAvailableGroupsByUser(user: UserDO, skip?: number, limit?: number): Promise<Group[]> {
		const groups: Group[] = await this.groupRepo.findAvailableByUser(user, skip, limit);

		return groups;
	}

	public async findGroupsBySchoolIdAndGroupTypes(
		schoolId: EntityId,
		skip?: number,
		limit?: number,
		groupTypes?: GroupTypes[]
	): Promise<Group[]> {
		const group: Group[] = await this.groupRepo.findBySchoolIdAndGroupTypes(schoolId, skip, limit, groupTypes);

		return group;
	}

	public async findAvailableGroupsBySchoolId(schoolId: EntityId, skip?: number, limit?: number): Promise<Group[]> {
		const groups: Group[] = await this.groupRepo.findAvailableBySchoolId(schoolId, skip, limit);

		return groups;
	}

	public async findGroupsBySchoolIdAndSystemIdAndGroupType(
		schoolId: EntityId,
		systemId: EntityId,
		groupType: GroupTypes
	): Promise<Group[]> {
		const group: Group[] = await this.groupRepo.findGroupsBySchoolIdAndSystemIdAndGroupType(
			schoolId,
			systemId,
			groupType
		);

		return group;
	}

	public async save(group: Group): Promise<Group> {
		const savedGroup: Group = await this.groupRepo.save(group);

		return savedGroup;
	}

	public async delete(group: Group): Promise<void> {
		await this.groupRepo.delete(group);

		await this.removeCourseSyncReference(group);
	}

	private async removeCourseSyncReference(group: Group) {
		const courses: Course[] = await this.courseService.findBySyncedGroup(group);

		courses.forEach((course: Course): void => {
			course.studentIds = [];
			course.syncedWithGroup = undefined;
		});

		await this.courseService.saveAll(courses);
	}
}
