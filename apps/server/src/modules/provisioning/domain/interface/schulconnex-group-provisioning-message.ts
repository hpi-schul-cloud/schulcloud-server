import { EntityId } from '@shared/domain/types';
import { ExternalGroupDto, ExternalSchoolDto } from '../../dto';

export interface SchulconnexGroupProvisioningMessage {
	externalGroup: ExternalGroupDto;
	externalSchool?: ExternalSchoolDto;
	systemId: EntityId;
}
