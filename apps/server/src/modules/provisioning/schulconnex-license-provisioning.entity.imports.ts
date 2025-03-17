import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { Role } from '@modules/role/repo';
import { MediaSchoolLicenseEntity, SchoolLicenseEntity } from '@modules/school-license/entity';
import { FederalStateEntity, SchoolEntity, SchoolYearEntity, StorageProviderEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/repo';
import { ExternalToolEntity } from '@modules/tool/external-tool/repo';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/repo';
import { MediaUserLicenseEntity, UserLicenseEntity } from '@modules/user-license/entity';
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
	ExternalToolEntity,
	SchoolExternalToolEntity,
	ContextExternalToolEntity,
	MediaSourceEntity,
	UserLicenseEntity,
	MediaUserLicenseEntity,
	SchoolLicenseEntity,
	MediaSchoolLicenseEntity,
];
