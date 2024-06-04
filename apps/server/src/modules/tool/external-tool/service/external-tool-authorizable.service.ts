import { AuthorizationLoaderService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ExternalToolRepo } from '@shared/repo';
import { ExternalTool } from '../domain';

@Injectable()
export class ExternalToolAuthorizableService implements AuthorizationLoaderService {
	constructor(private readonly externalToolRepo: ExternalToolRepo) {}

	// TODO: N21-1967 test
	async findById(id: EntityId): Promise<ExternalTool> {
		const externalTool: ExternalTool = await this.externalToolRepo.findById(id);

		return externalTool;
	}
}
