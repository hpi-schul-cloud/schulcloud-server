import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { LtiToolDO, Pseudonym, UserDO } from '@shared/domain';
import { v4 as uuidv4 } from 'uuid';
import { IToolFeatures, ToolFeatures } from '@src/modules/tool/tool-config';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalTool } from '@src/modules/tool/external-tool/domain';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from '../repo';

@Injectable()
export class PseudonymService {
	constructor(
		@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures,
		private readonly pseudonymRepo: PseudonymsRepo,
		private readonly externalToolPseudonymRepo: ExternalToolPseudonymRepo
	) {}

	public async findByUserAndTool(user: UserDO, tool: ExternalTool | LtiToolDO): Promise<Pseudonym> {
		if (!user.id || !tool.id) {
			throw new InternalServerErrorException('User or tool id is missing');
		}

		const pseudonymPromise: Promise<Pseudonym> = this.getRepository(tool).findByUserIdAndToolIdOrFail(user.id, tool.id);

		return pseudonymPromise;
	}

	public async findOrCreatePseudonym(user: UserDO, tool: ExternalTool | LtiToolDO): Promise<Pseudonym> {
		if (!user.id || !tool.id) {
			throw new InternalServerErrorException('User or tool id is missing');
		}

		const repository: PseudonymsRepo | ExternalToolPseudonymRepo = this.getRepository(tool);

		let pseudonym: Pseudonym | null = await repository.findByUserIdAndToolId(user.id, tool.id);
		if (!pseudonym) {
			pseudonym = new Pseudonym({
				id: new ObjectId().toHexString(),
				pseudonym: uuidv4(),
				userId: user.id,
				toolId: tool.id,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			pseudonym = await repository.createOrUpdate(pseudonym);
		}

		return pseudonym;
	}

	private getRepository(tool: ExternalTool | LtiToolDO): PseudonymsRepo | ExternalToolPseudonymRepo {
		if (this.toolFeatures.ctlToolsTabEnabled && tool instanceof ExternalTool) {
			return this.externalToolPseudonymRepo;
		}
		return this.pseudonymRepo;
	}
}
