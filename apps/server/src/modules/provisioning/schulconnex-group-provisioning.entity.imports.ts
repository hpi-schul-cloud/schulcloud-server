import { ClassEntity } from '@modules/class/entity';
import { GroupEntity } from '@modules/group/entity';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { SystemEntity } from '@modules/system/entity/system.entity';
import { Course } from '@shared/domain/entity/course.entity';
import { CourseGroup } from '@shared/domain/entity/coursegroup.entity';
import { FederalStateEntity } from '@shared/domain/entity/federal-state.entity';
import { Role } from '@shared/domain/entity/role.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
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

export const TEST_ENTITIES = [...ENTITIES];
