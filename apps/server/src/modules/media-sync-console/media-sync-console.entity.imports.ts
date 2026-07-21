import { InstanceEntity } from '@modules/instance';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { MediaSchoolLicenseEntity, SchoolLicenseEntity } from '@modules/school-license/entity';
import { SchoolEntity, SchoolYearEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { ContextExternalToolRepo } from '@modules/tool/context-external-tool/repo';
import { ExternalToolEntity } from '@modules/tool/external-tool/repo';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';

export const ENTITIES = [
	MediaSourceEntity,
	ExternalToolEntity,
	SchoolExternalToolEntity,
	ContextExternalToolRepo,
	InstanceEntity,
	SchoolLicenseEntity,
	MediaSchoolLicenseEntity,
	SchoolEntity,
	SchoolYearEntity,
];

export const TEST_ENTITIES = [SystemEntity, SchoolSystemOptionsEntity, UserLoginMigrationEntity, ...ENTITIES];
