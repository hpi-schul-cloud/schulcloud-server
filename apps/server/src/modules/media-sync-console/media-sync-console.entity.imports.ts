import { InstanceEntity } from '@modules/instance';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { MediaSchoolLicenseEntity, SchoolLicenseEntity } from '@modules/school-license/entity';
import { SchoolEntity, SchoolYearEntity } from '@modules/school/repo';
import { ContextExternalToolRepo } from '@modules/tool/context-external-tool/repo';
import { ExternalToolEntity } from '@modules/tool/external-tool/repo';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/repo';

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

export const TEST_ENTITIES = [...ENTITIES];
