import { ClassEntity } from '@modules/class/entity';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { CourseSynchronizationHistoryEntity } from '@modules/course-synchronization-history/repo';
import { GroupEntity } from '@modules/group/entity';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { Role } from '@modules/role/repo';
import { FederalStateEntity, SchoolEntity, SchoolYearEntity, StorageProviderEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { User } from '@modules/user/repo';

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
	CourseSynchronizationHistoryEntity,
];
