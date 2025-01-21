import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderServiceGeneric,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { TeamEntity } from '@shared/domain/entity';
import { TeamsRepo } from '@shared/repo/teams';

@Injectable()
export class TeamAuthorisableService implements AuthorizationLoaderServiceGeneric<TeamEntity> {
	constructor(
		private readonly teamsRepo: TeamsRepo,
		injectionService: AuthorizationInjectionService,
	) {
		injectionService.injectReferenceLoader(AuthorizableReferenceType.Team, this);
	}

	findById(id: string): Promise<TeamEntity> {
		return this.teamsRepo.findById(id, true);
	}
}
