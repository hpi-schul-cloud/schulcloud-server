import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { System, SystemService } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { AnyProvisioningOptions, SchoolSystemOptions, SchoolSystemOptionsBuilder } from '../domain';
import { ProvisioningOptionsInterface } from '../interface';
import { ProvisioningStrategyMissingLoggableException } from '../loggable';
import { SchoolSystemOptionsService } from '../service';

@Injectable()
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
			throw new NotFoundLoggableException(SchoolSystemOptions.name, { schoolId, systemId });
		}

		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			schoolSystemOptions,
			AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_VIEW])
		);

		return schoolSystemOptions.provisioningOptions;
	}

	public async createOrUpdateProvisioningOptions(
		userId: EntityId,
		schoolId: EntityId,
		systemId: EntityId,
		requestedProvisioningOptions: ProvisioningOptionsInterface
	): Promise<AnyProvisioningOptions> {
		const system: System | null = await this.systemService.findById(systemId);

		if (!system) {
			throw new NotFoundLoggableException(System.name, { id: systemId });
		}

		if (!system.provisioningStrategy) {
			throw new ProvisioningStrategyMissingLoggableException(systemId);
		}

		const provisioningOptions: AnyProvisioningOptions = new SchoolSystemOptionsBuilder(
			system.provisioningStrategy
		).buildProvisioningOptions(requestedProvisioningOptions);

		const existingSchoolSystemOptions: SchoolSystemOptions | null =
			await this.schoolSystemOptionsService.findBySchoolIdAndSystemId(schoolId, systemId);

		const schoolSystemOptions: SchoolSystemOptions = new SchoolSystemOptions<AnyProvisioningOptions>({
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

		const savedSchoolSystemOptions: SchoolSystemOptions = await this.schoolSystemOptionsService.save(
			schoolSystemOptions
		);

		return savedSchoolSystemOptions.provisioningOptions;
	}
}
