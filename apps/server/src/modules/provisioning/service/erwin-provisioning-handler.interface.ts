import { Class } from '@modules/class';
import { ReferencedEntityType } from '@modules/erwin-identifier';
import { School } from '@modules/school';
import { UserDo } from '@modules/user';
import { ExternalClassDto, ExternalSchoolDto, ExternalUserDto, ProvisioningSystemDto } from '../dto';

export type ProvisioningResult = School | UserDo | Class;

export type ExternalEntityData = ExternalSchoolDto | ExternalUserDto | ExternalClassDto;

export interface ProvisioningContext {
	system: ProvisioningSystemDto;
	externalSchool?: ExternalSchoolDto;
	externalUser?: ExternalUserDto;
	externalClass?: ExternalClassDto;
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
