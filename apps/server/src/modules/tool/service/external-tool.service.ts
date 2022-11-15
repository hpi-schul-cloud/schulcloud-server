import { ForbiddenException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool.do';
import { ExternalTool, ICurrentUser, IExternalToolProperties, RoleName, User } from '@shared/domain';
import { EntityProperties, UserRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules';
import { ExternalToolDORepo } from '@shared/repo/externaltool/external-tool-do.repo';

@Injectable()
export class ExternalToolService {
	constructor(
		private externalToolRepo: ExternalToolDORepo,
		private readonly userRepo: UserRepo,
		private readonly authorizationService: AuthorizationService
	) {}

	// map to Entity
	// and create
	// return ExternalToolDto
	async createExternalTool(externalToolDO: ExternalToolDO, currentUser: ICurrentUser): Promise<ExternalToolDO> {
		const user: User = await this.userRepo.findById(currentUser.userId);
		const isSuperhero = this.authorizationService.hasRole(user, RoleName.SUPERHERO);
		if (isSuperhero) {
			const externalTool: ExternalToolDO = await this.externalToolRepo.save(externalToolDO);
			return externalTool;
		}
		throw UnauthorizedException;
	}
}
