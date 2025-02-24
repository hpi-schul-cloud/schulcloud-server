import { ClassEntity } from '@modules/class/entity';
import { GroupEntity } from '@modules/group/entity';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { SchoolEntity, SchoolYearEntity, FederalStateEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/entity/system.entity';
import { Course } from '@shared/domain/entity/course.entity';
import { CourseGroup } from '@shared/domain/entity/coursegroup.entity';
import { Role } from '@shared/domain/entity/role.entity';
import { StorageProviderEntity } from '@shared/domain/entity/storageprovider.entity';
import { UserLoginMigrationEntity } from '@shared/domain/entity/user-login-migration.entity';
import { User } from '@shared/domain/entity/user.entity';

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
	Course,
	CourseGroup,
	ClassEntity,
	GroupEntity,
];
