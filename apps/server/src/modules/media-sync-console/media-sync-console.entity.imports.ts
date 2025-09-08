import { InstanceEntity } from '@modules/instance';
import { MediaSourceEntity } from '@modules/media-source/entity';
import { ExternalToolEntity } from '@modules/tool/external-tool/repo';
import { SchoolEntity, SchoolYearEntity } from '@modules/school/repo';
import { MediaSchoolLicenseEntity, SchoolLicenseEntity } from '@modules/school-license/entity';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/repo';
import { ContextExternalToolRepo } from '@modules/tool/context-external-tool/repo';

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
