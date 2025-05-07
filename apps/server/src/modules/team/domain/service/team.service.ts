import { Logger } from '@core/logger';
import {
	DataDeletionDomainOperationLoggable,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
	UserDeletionInjectionService,
} from '@modules/deletion';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { TeamEntity, TeamRepo } from '../../repo';

@Injectable()
export class TeamService implements DeletionService {
	constructor(
		private readonly teamRepo: TeamRepo,
		private readonly logger: Logger,
		userDeletionInjectionService: UserDeletionInjectionService
	) {
		this.logger.setContext(TeamService.name);
		userDeletionInjectionService.injectUserDeletionService(this);
	}

	public async findUserDataFromTeams(userId: EntityId): Promise<TeamEntity[]> {
		const teams = await this.teamRepo.findByUserId(userId);

		return teams;
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Teams',
				DomainName.TEAMS,
				userId,
				StatusModel.PENDING
			)
		);
		const teams = await this.teamRepo.findByUserId(userId);

		const numberOfUpdatedTeams = await this.teamRepo.removeUserReferences(userId);

		const result = DomainDeletionReportBuilder.build(DomainName.TEAMS, [
			DomainOperationReportBuilder.build(OperationType.UPDATE, numberOfUpdatedTeams, this.getTeamsId(teams)),
		]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from Teams',
				DomainName.TEAMS,
				userId,
				StatusModel.FINISHED,
				numberOfUpdatedTeams,
				0
			)
		);

		return result;
	}

	private getTeamsId(teams: TeamEntity[]): EntityId[] {
		return teams.map((team) => team.id);
	}
}
