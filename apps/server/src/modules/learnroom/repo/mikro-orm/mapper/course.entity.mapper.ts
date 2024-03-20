import { EntityData } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ClassEntity } from '@modules/class/entity';
import { GroupEntity } from '@modules/group/entity';
import { Course as CourseEntity, CourseGroup, SchoolEntity, User as UserEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { Course, CourseProps } from '../../../domain';

export class CourseEntityMapper {
	public static mapEntityToDo(entity: CourseEntity): Course {
		const courseGroupIds: EntityId[] = entity.courseGroups
			.getItems()
			.map((courseGroup: CourseGroup): EntityId => courseGroup.id);

		const classIds: EntityId[] = entity.classes.getItems().map((clazz: ClassEntity): EntityId => clazz.id);
		const groupIds: EntityId[] = entity.groups.getItems().map((group: GroupEntity): EntityId => group.id);

		const studentIds: EntityId[] = entity.students.getItems().map((user: UserEntity): EntityId => user.id);
		const teacherIds: EntityId[] = entity.teachers.getItems().map((user: UserEntity): EntityId => user.id);
		const substitutionTeacherIds: EntityId[] = entity.substitutionTeachers
			.getItems()
			.map((user: UserEntity): EntityId => user.id);

		const course = new Course({
			id: entity.id,
			name: entity.name,
			color: entity.color,
			description: entity.description,
			startDate: entity.startDate,
			untilDate: entity.untilDate,
			features: new Set(entity.features),
			schoolId: entity.school.id,
			studentIds,
			teacherIds,
			substitutionTeacherIds,
			classIds,
			groupIds,
			courseGroupIds,
			copyingSince: entity.copyingSince,
			shareToken: entity.shareToken,
			syncedWithGroup: entity.syncedWithGroup?.id,
		});

		return course;
	}

	public static mapDoToEntityData(domainObject: Course, em: EntityManager): EntityData<CourseEntity> {
		const props: CourseProps = domainObject.getProps();
		const school: SchoolEntity = em.getReference(SchoolEntity, props.schoolId);
		const courseGroups: CourseGroup[] = props.courseGroupIds.map(
			(id: EntityId): CourseGroup => em.getReference(CourseGroup, id)
		);

		const classes: ClassEntity[] = props.classIds.map((id: EntityId): ClassEntity => em.getReference(ClassEntity, id));
		const groups: GroupEntity[] = props.groupIds.map((id: EntityId): GroupEntity => em.getReference(GroupEntity, id));

		const students: UserEntity[] = props.studentIds.map((id: EntityId): UserEntity => em.getReference(UserEntity, id));
		const teachers: UserEntity[] = props.teacherIds.map((id: EntityId): UserEntity => em.getReference(UserEntity, id));
		const substitutionTeachers: UserEntity[] = props.substitutionTeacherIds.map(
			(id: EntityId): UserEntity => em.getReference(UserEntity, id)
		);

		const courseEntityData: EntityData<CourseEntity> = {
			name: props.name,
			color: props.color,
			description: props.description,
			startDate: props.startDate,
			untilDate: props.untilDate,
			features: Array.from(props.features),
			school,
			students,
			teachers,
			substitutionTeachers,
			classes,
			groups,
			courseGroups,
			copyingSince: props.copyingSince,
			shareToken: props.shareToken,
			syncedWithGroup: props.syncedWithGroup,
		};

		return courseEntityData;
	}
}
