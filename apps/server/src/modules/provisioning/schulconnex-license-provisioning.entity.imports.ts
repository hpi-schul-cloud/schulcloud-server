import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { FederalStateEntity, SchoolEntity, SchoolYearEntity } from '@modules/school/repo';
import { MediaSchoolLicenseEntity, SchoolLicenseEntity } from '@modules/school-license/entity';
import { SystemEntity } from '@modules/system/repo';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/repo';
import { ExternalToolEntity } from '@modules/tool/external-tool/repo';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/repo';
import { MediaUserLicenseEntity, UserLicenseEntity } from '@modules/user-license/entity';
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
	ExternalToolEntity,
	SchoolExternalToolEntity,
	ContextExternalToolEntity,
	MediaSourceEntity,
	UserLicenseEntity,
	MediaUserLicenseEntity,
	SchoolLicenseEntity,
	MediaSchoolLicenseEntity,
];
