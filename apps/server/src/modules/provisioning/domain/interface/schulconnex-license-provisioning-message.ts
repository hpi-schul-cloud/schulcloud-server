import { type EntityId } from '@shared/domain/types';
import { type ExternalLicenseDto } from '../../dto';

export interface SchulconnexLicenseProvisioningMessage {
	userId: EntityId;
	schoolId: EntityId;
	systemId: EntityId;
	externalLicenses: ExternalLicenseDto[];
}
