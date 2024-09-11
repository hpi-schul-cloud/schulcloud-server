import { Injectable } from '@nestjs/common';
import { TeamEntity } from '@shared/domain/entity';
import { TeamsRepo } from '@shared/repo';
import { AuthorizationLoaderServiceGeneric } from '@src/modules/authorization';

@Injectable()
export class TeamAuthorisableService implements AuthorizationLoaderServiceGeneric<TeamEntity> {
	constructor(private readonly teamsRepo: TeamsRepo) {}

	findById(id: string): Promise<TeamEntity> {
		return this.teamsRepo.findById(id, true);
	}
}
