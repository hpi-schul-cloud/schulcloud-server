import { EntityId } from '@shared/domain/types';
import { ExternalLicenseDto } from '../../dto';

export interface SchulconnexLicenseProvisioningMessage {
	userId: EntityId;
	schoolId: EntityId;
	systemId: EntityId;
	externalLicenses: ExternalLicenseDto[];
}
