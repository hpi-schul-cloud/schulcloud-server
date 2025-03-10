import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderServiceGeneric,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { TeamEntity, TeamRepo } from '../../repo';

@Injectable()
export class TeamAuthorisableService implements AuthorizationLoaderServiceGeneric<TeamEntity> {
	constructor(private readonly teamRepo: TeamRepo, injectionService: AuthorizationInjectionService) {
		injectionService.injectReferenceLoader(AuthorizableReferenceType.Team, this);
	}

	findById(id: string): Promise<TeamEntity> {
		return this.teamRepo.findById(id, true);
	}
}
