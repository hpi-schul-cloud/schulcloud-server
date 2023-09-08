import { Injectable } from '@nestjs/common';
import { FederalStateService } from '../service/federal-state.service';

@Injectable()
export class FederalStateUC {
	constructor(
		private readonly federalStateService: FederalStateService // 	private readonly authorizationService: AuthorizationService, // 	private readonly lessonService: LessonService
	) {}

	async findAllFederalStates() {
		const federalStates = await this.federalStateService.findAll();
		return federalStates;
	}

	// TODO: names could be an enum
	async findFederalStateByName(name: string) {
		const federalState = await this.federalStateService.findFederalStateByName(name);
		return federalState;
	}
}
