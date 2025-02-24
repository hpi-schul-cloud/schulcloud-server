import { ClassEntity } from '@modules/class/entity';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { GroupEntity } from '@modules/group/entity';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { FederalStateEntity, SchoolEntity, SchoolYearEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/entity/system.entity';
import { User } from '@modules/user/repo';
import { Role } from '@shared/domain/entity/role.entity';
import { StorageProviderEntity } from '@shared/domain/entity/storageprovider.entity';
import { UserLoginMigrationEntity } from '@shared/domain/entity/user-login-migration.entity';

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
