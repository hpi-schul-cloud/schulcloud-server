import { type Class } from '@modules/class';
import { type ReferencedEntityType } from '@modules/erwin-identifier';
import { type School } from '@modules/school';
import { type UserDo } from '@modules/user';
import {
	type ExternalClassDto,
	type ExternalSchoolDto,
	type ExternalUserDto,
	type ProvisioningSystemDto,
} from '../dto';

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
