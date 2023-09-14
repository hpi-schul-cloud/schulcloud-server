import { Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { FederalStateDO, FederalStateProps } from '../domainobject';
import { FederalStateService } from '../service/federal-state.service';

@Injectable()
export class FederalStateUC {
	constructor(
		private readonly federalStateService: FederalStateService,
		private readonly authorizationService: AuthorizationService
	) {}

	async findAllFederalStates(userId: EntityId) {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkOneOfPermissions(user, [Permission.FEDERALSTATE_VIEW]);
		const federalStates = await this.federalStateService.findAll();
		return federalStates;
	}

	async createFederalState(federalState: FederalStateProps, userId: EntityId) {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkOneOfPermissions(user, [Permission.FEDERALSTATE_CREATE]);
		const createdFederalState = await this.federalStateService.create(federalState);
		return createdFederalState;
	}

	// TODO: names could be an enum
	async findFederalStateByName(name: string) {
		const federalState = await this.federalStateService.findFederalStateByName(name);
		return federalState;
	}
}
