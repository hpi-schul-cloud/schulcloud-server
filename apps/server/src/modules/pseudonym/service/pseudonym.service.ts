import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ExternalToolDO, LtiToolDO, Pseudonym, UserDO } from '@shared/domain';
import { v4 as uuidv4 } from 'uuid';
import { IToolFeatures, ToolFeatures } from '@src/modules/tool/tool-config';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from '../repo';

@Injectable()
export class PseudonymService {
	constructor(
		@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures,
		private readonly pseudonymRepo: PseudonymsRepo,
		private readonly externalToolPseudonymRepo: ExternalToolPseudonymRepo
	) {}

	public async findByUserAndTool(user: UserDO, tool: ExternalToolDO | LtiToolDO): Promise<Pseudonym> {
		if (!user.id || !tool.id) {
			throw new InternalServerErrorException('User or tool id is missing');
		}

		const pseudonymPromise: Promise<Pseudonym> = this.getRepository(tool).findByUserIdAndToolIdOrFail(user.id, tool.id);

		return pseudonymPromise;
	}

	public async findOrCreatePseudonym(user: UserDO, tool: ExternalToolDO | LtiToolDO): Promise<Pseudonym> {
		if (!user.id || !tool.id) {
			throw new InternalServerErrorException('User or tool id is missing');
		}

		const repository: PseudonymsRepo | ExternalToolPseudonymRepo = this.getRepository(tool);

		let pseudonym: Pseudonym | null = await repository.findByUserIdAndToolId(user.id, tool.id);
		if (!pseudonym) {
			pseudonym = new Pseudonym({
				// TODO: handle creation of ids in the domain layer
				id: '',
				pseudonym: uuidv4(),
				userId: user.id,
				toolId: tool.id,
			});

			pseudonym = await repository.save(pseudonym);
		}

		return pseudonym;
	}

	private getRepository(tool: ExternalToolDO | LtiToolDO): PseudonymsRepo | ExternalToolPseudonymRepo {
		if (this.toolFeatures.ctlToolsTabEnabled && tool instanceof ExternalToolDO) {
			return this.externalToolPseudonymRepo;
		}
		return this.pseudonymRepo;
	}
}
