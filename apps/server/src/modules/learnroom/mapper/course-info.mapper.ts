import { Course, Role, User } from '@shared/domain/entity';
import { ClassEntity } from '../../class/entity';
import { GroupEntity } from '../../group/entity';
import { UserDto } from '../../user/uc/dto/user.dto';
import { ClassInfoDto, CourseInfoDto } from '../uc/dto';
import { GroupInfoDto } from '../uc/dto/group-info.dto';

export class CourseInfoMapper {
	public static mapCourseToCourseInfoDto(course: Course): CourseInfoDto {
		const mapped: CourseInfoDto = new CourseInfoDto({
			id: course.id,
			name: course.name,
			classes: this.mapToClassesInfos(course.classes.getItems()),
			teachers: this.mapToUserDtos(course.teachers.getItems()),
			syncedWithGroup: course.syncedWithGroup ? this.mapToSyncedWithGroupInfo(course.syncedWithGroup) : undefined,
		});

		return mapped;
	}

	private static mapToClassesInfos(clazzes: ClassEntity[]): ClassInfoDto[] {
		const mapped = clazzes.map((clazz) => this.mapToClassInfo(clazz));

		return mapped;
	}

	private static mapToClassInfo(clazz: ClassEntity): ClassInfoDto {
		const mapped = new ClassInfoDto({
			id: clazz.id,
			name: clazz.name,
		});

		return mapped;
	}

	private static mapToUserDtos(users: User[]) {
		const mapped = users.map((user) => this.mapToUserDto(user));

		return mapped;
	}

	private static mapToUserDto(user: User): UserDto {
		return new UserDto({
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			roleIds: user.roles.getItems().map((role: Role) => role.id),
			schoolId: user.school.id,
			ldapDn: user.ldapDn,
			externalId: user.externalId,
			language: user.language,
			forcePasswordChange: user.forcePasswordChange,
			preferences: user.preferences,
			lastLoginSystemChange: user.lastLoginSystemChange,
			outdatedSince: user.outdatedSince,
		});
	}

	private static mapToSyncedWithGroupInfo(group: GroupEntity): GroupInfoDto {
		const mapped = new GroupInfoDto({ id: group.id, name: group.name });
		return mapped;
	}
}
