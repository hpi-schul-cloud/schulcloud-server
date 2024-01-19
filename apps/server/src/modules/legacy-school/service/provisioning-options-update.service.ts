import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AnyProvisioningOptions, ProvisioningOptionsType } from '../domain';
import { ProvisioningOptionsUpdateHandler } from './provisioning-options-update-handler';
import { SchulconnexProvisioningOptionsUpdateService } from './schulconnex-provisioning-options-update.service';

@Injectable()
export class ProvisioningOptionsUpdateService {
	private readonly updateServices = new Map<ProvisioningOptionsType, ProvisioningOptionsUpdateHandler>();

	constructor(
		private readonly schulconnexProvisioningOptionsUpdateService: SchulconnexProvisioningOptionsUpdateService
	) {
		this.updateServices.set(ProvisioningOptionsType.SCHULCONNEX, this.schulconnexProvisioningOptionsUpdateService);
	}

	public async handleUpdate(
		schoolId: EntityId,
		systemId: EntityId,
		newOptions: AnyProvisioningOptions,
		oldOptions: AnyProvisioningOptions
	): Promise<void> {
		const updater: ProvisioningOptionsUpdateHandler | undefined = this.updateServices.get(oldOptions.getType);

		if (updater) {
			await updater.handleUpdate(schoolId, systemId, newOptions, oldOptions);
		}
	}
}
