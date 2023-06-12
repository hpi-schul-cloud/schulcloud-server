import { Injectable } from '@nestjs/common';
import { EntityId, ExternalToolDO, PseudonymDO } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { PseudonymsRepo } from '@shared/repo';
import { LtiToolService } from '@src/modules/lti-tool/service';
import { ExternalToolService } from '@src/modules/tool/service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PseudonymService {
	constructor(
		private readonly pseudonymRepo: PseudonymsRepo,
		private readonly externalToolService: ExternalToolService,
		private readonly ltiToolService: LtiToolService
	) {}

	public async createPseudonym(userId: EntityId, toolId: EntityId): Promise<PseudonymDO> {
		const pseudonym: PseudonymDO = new PseudonymDO({
			pseudonym: uuidv4(),
			userId,
			toolId,
		});

		const savedPseudonym: Promise<PseudonymDO> = this.pseudonymRepo.save(pseudonym);

		return savedPseudonym;
	}

	public async findByUserIdAndToolId(userId: EntityId, toolId: EntityId): Promise<PseudonymDO> {
		const pseudonym: Promise<PseudonymDO> = this.pseudonymRepo.findByUserIdAndToolId(userId, toolId);

		return pseudonym;
	}

	public async findByUserIdAndOAuth2ClientId(userId: EntityId, clientId: string): Promise<PseudonymDO | null> {
		const externalTool: ExternalToolDO | null = await this.externalToolService.findExternalToolByOAuth2ConfigClientId(
			clientId
		);
		const ltiTool: LtiToolDO | null = await this.ltiToolService.findByClientIdAndIsLocal(clientId, true);

		if (externalTool && externalTool.id) {
			const pseudonym: Promise<PseudonymDO> = this.pseudonymRepo.findByUserIdAndToolId(userId, externalTool.id);

			return pseudonym;
		}

		if (ltiTool && ltiTool.id) {
			const pseudonym: Promise<PseudonymDO> = this.pseudonymRepo.findByUserIdAndToolId(userId, ltiTool.id);

			return pseudonym;
		}

		return null;
	}
}
