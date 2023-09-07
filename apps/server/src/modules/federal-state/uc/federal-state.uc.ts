import { Injectable } from '@nestjs/common';
import { FederalStateService } from '../service/federal-state.service';

@Injectable()
export class FederalStateUC {
	constructor(
		private readonly federalStateService: FederalStateService // 	private readonly authorizationService: AuthorizationService, // 	private readonly lessonService: LessonService
	) {}

	createFederalState() {
		return 'hi from the uc';
	}

	async findAllFederalStates() {
		const federalStates = await this.federalStateService.findAll();
		return federalStates;
	}

	async findFederalStateByName(name: string) {
		const federalState = await this.federalStateService.findFederalStateByName(name);
		return federalState;
	}
}
