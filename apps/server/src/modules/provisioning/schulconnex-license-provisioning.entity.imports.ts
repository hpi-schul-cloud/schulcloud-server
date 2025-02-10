/* istanbul ignore file */
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { SystemEntity } from '@modules/system/entity/system.entity';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { UserLicenseEntity } from '@modules/user-license/entity';
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
	ExternalToolEntity,
	SchoolExternalToolEntity,
	ContextExternalToolEntity,
	MediaSourceEntity,
	UserLicenseEntity,
];

export const TEST_ENTITIES = [...ENTITIES];
