import { ClassEntity } from '@modules/class/entity';
import { CourseEntity } from '@modules/course/repo/course.entity';
import { CourseGroupEntity } from '@modules/course/repo/coursegroup.entity';
import { GroupEntity } from '@modules/group/entity';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { FederalStateEntity, SchoolEntity, SchoolYearEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { User } from '@modules/user/repo';
import { Role } from '@shared/domain/entity/role.entity';
import { StorageProviderEntity } from '@shared/domain/entity/storageprovider.entity';

export const ENTITIES = [
	SchoolEntity,
	SystemEntity,
	SchoolYearEntity,
	UserLoginMigrationEntity,
	FederalStateEntity,
	StorageProviderEntity,
	SchoolSystemOptionsEntity,
	User,
	Role,
	CourseEntity,
	CourseGroupEntity,
	ClassEntity,
	GroupEntity,
];
