import { ReferencedEntityType } from '@modules/erwin-identifier';
import { School } from '@modules/school';
import { UserDo } from '@modules/user';
import { ExternalSchoolDto, ExternalUserDto, ProvisioningSystemDto } from '../dto';

export type ProvisioningResult = School | UserDo;
// TODO: Add Class type when implementing class provisioning

export type ExternalEntityData = ExternalSchoolDto | ExternalUserDto;
// TODO: Add ExternalClassDto when implementing class provisioning

export interface ProvisioningContext {
	system: ProvisioningSystemDto;
	externalSchool?: ExternalSchoolDto;
	externalUser?: ExternalUserDto;
	// TODO: Add externalClasses field when implementing class provisioning
}

export interface ProvisioningEntityHandler {
	validate(context: ProvisioningContext): void;
	getExternalData(context: ProvisioningContext): ExternalEntityData;
	getErwinId(context: ProvisioningContext): string | undefined;
	referencedEntityType: ReferencedEntityType;
	dtoName: string;
	findByEntityId(entityId: string): Promise<ProvisioningResult | null>;
	findByExternalId(context: ProvisioningContext): Promise<ProvisioningResult | null>;
	create(context: ProvisioningContext): Promise<ProvisioningResult>;
	update(entity: ProvisioningResult, externalData: ExternalEntityData): Promise<ProvisioningResult>;
}
