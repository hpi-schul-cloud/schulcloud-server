import { Injectable } from '@nestjs/common';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool.do';
import { ExternalTool } from '@shared/domain';

@Injectable()
export class ExternalToolService {
	constructor(private readonly externalToolRepo: ExternalToolRepo) {}

	// map to Entity
	// and create
	// return ExternalToolDto
	async createExternalTool(externalTool: ExternalToolDO): ExternalToolDO {
		const externalToolEntity: ExternalTool = this.externalToolRepo.mapDOToEntityProperties(externalTool);
		const externalToolCreated: ExternalTool = this.externalToolRepo.create(externalToolEntity);
		const mapped: ExternalToolDO = this.externalToolRepo.mapEntityToDO(externalToolCreated);
		return mapped;
	}
}
