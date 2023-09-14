import { Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { IFederalStateCreate } from '../interface';
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

	async createFederalState(federalStateCreate: IFederalStateCreate, userId: EntityId) {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkOneOfPermissions(user, [Permission.FEDERALSTATE_CREATE]);
		const createdFederalState = await this.federalStateService.create(federalStateCreate);
		return createdFederalState;
	}

	// TODO: names could be an enum
	async findFederalStateByName(name: string) {
		const federalState = await this.federalStateService.findFederalStateByName(name);
		return federalState;
	}

	async deleteFederalState(id: string, userId: EntityId) {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkOneOfPermissions(user, [Permission.FEDERALSTATE_EDIT]);
		const deletedFederalState = await this.federalStateService.delete(id);
		return deletedFederalState;
	}
}
