import { Injectable } from '@nestjs/common';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool.do';
import { ICurrentUser } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { ExternalToolDORepo } from '@shared/repo/externaltool/external-tool-do.repo';

@Injectable()
export class ExternalToolService {
	constructor(private externalToolRepo: ExternalToolDORepo, private readonly userRepo: UserRepo) {}

	async createExternalTool(externalToolDO: ExternalToolDO, currentUser: ICurrentUser): Promise<ExternalToolDO> {
		const externalTool: ExternalToolDO = await this.externalToolRepo.save(externalToolDO);
		return externalTool;
	}

	isNameUnique(externalToolDO: ExternalToolDO): boolean {
		const duplicate = this.externalToolRepo.findByName(externalToolDO.name);
		return duplicate !== null;
	}
}
