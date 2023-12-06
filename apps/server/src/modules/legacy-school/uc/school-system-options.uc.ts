import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { System, SystemService } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { EntityId } from '@shared/domain/types';
import { AnyProvisioningOptions, SchoolSystemOptions, SchulConneXProvisioningOptions } from '../domain';
import { ProvisioningOptionsInterface } from '../interface';

@Injectable
export class SchoolSystemOptionsUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly systemService: SystemService,
		private readonly schoolSystemOptionsService: SchoolSystemOptionsService
	) {}

	public async getProvisioningOptions(
		userId: EntityId,
		schoolId: EntityId,
		systemId: EntityId
	): Promise<AnyProvisioningOptions> {
		const schoolSystemOptions: SchoolSystemOptions | null =
			await this.schoolSystemOptionsService.findBySchoolIdAndSystemId(schoolId, systemId);

		if (!schoolSystemOptions) {
			throw new NotFoundLoggableException(SchoolSystemOptions.name, 'schoolId', schoolId); // TODO multi-id?
		}

		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			schoolSystemOptions,
			AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_VIEW])
		);

		return schoolSystemOptions.provisioningOptions;
	}

	public async setProvisioningOptions(
		userId: EntityId,
		schoolId: EntityId,
		systemId: EntityId,
		requestedProvisioningOptions: ProvisioningOptionsInterface
	): Promise<AnyProvisioningOptions> {
		const system: System | null = await this.systemService.findById(systemId);

		if (!system) {
			throw new NotFoundLoggableException(System.name, 'id', systemId);
		}

		if (!system.provisioningStrategy) {
			throw new Error(); // TODO error
		}

		const optionsForStrategy: Map<SystemProvisioningStrategy, new () => AnyProvisioningOptions> = new Map([
			[SystemProvisioningStrategy.SANIS, SchulConneXProvisioningOptions],
		]); // TODO extract

		const ProvisioningOptionsConstructor: (new () => AnyProvisioningOptions) | undefined = optionsForStrategy.get(
			system.provisioningStrategy
		);

		if (!ProvisioningOptionsConstructor) {
			throw new Error(); // TODO error
		}

		const provisioningOptions: AnyProvisioningOptions = new ProvisioningOptionsConstructor();

		if (!provisioningOptions.isApplicable(requestedProvisioningOptions)) {
			throw new Error(); // TODO error
		}

		provisioningOptions.set(requestedProvisioningOptions);

		const existingSchoolSystemOptions: SchoolSystemOptions<AnyProvisioningOptions> | null =
			await this.schoolSystemOptionsService.findBySchoolIdAndSystemId(schoolId, systemId);

		const schoolSystemOptions = new SchoolSystemOptions<SchulConneXProvisioningOptions>({
			id: existingSchoolSystemOptions?.id ?? new ObjectId().toHexString(),
			systemId,
			schoolId,
			provisioningOptions,
		});

		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			schoolSystemOptions,
			AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_EDIT])
		);

		const savedSchoolSystemOptions: SchoolSystemOptions<AnyProvisioningOptions> =
			await this.schoolSystemOptionsService.save(schoolSystemOptions);

		return savedSchoolSystemOptions.provisioningOptions;
	}
}
