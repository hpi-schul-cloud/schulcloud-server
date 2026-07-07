import { type EntityId } from '@shared/domain/types';
import { type ExternalGroupDto, type ExternalSchoolDto } from '../../dto';

export interface SchulconnexGroupProvisioningMessage {
	externalGroup: ExternalGroupDto;
	externalSchool?: ExternalSchoolDto;
	systemId: EntityId;
}
