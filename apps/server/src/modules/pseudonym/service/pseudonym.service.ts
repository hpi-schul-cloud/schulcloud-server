import { Logger } from '@core/logger';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { UserDo } from '@modules/user';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { PseudonymSearchQuery } from '../domain';
import { PSEUDONYM_CONFIG_TOKEN, PseudonymConfig } from '../pseudonym.config';
import { ExternalToolPseudonymRepo, Pseudonym } from '../repo';

@Injectable()
export class PseudonymService {
	constructor(
		private readonly externalToolPseudonymRepo: ExternalToolPseudonymRepo,
		private readonly logger: Logger,
		@Inject(PSEUDONYM_CONFIG_TOKEN) private readonly config: PseudonymConfig
	) {
		this.logger.setContext(PseudonymService.name);
	}

	public async findByUserAndToolOrThrow(user: UserDo, tool: ExternalTool): Promise<Pseudonym> {
		if (!user.id || !tool.id) {
			throw new InternalServerErrorException('User or tool id is missing');
		}

		const pseudonym = await this.externalToolPseudonymRepo.findByUserIdAndToolIdOrFail(user.id, tool.id);

		return pseudonym;
	}

	public async findByUserId(userId: string): Promise<Pseudonym[]> {
		if (!userId) {
			throw new InternalServerErrorException('User id is missing');
		}

		const pseudonyms = await this.externalToolPseudonymRepo.findByUserId(userId);

		return pseudonyms;
	}

	public async findOrCreatePseudonym(user: UserDo, tool: ExternalTool): Promise<Pseudonym> {
		if (!user.id || !tool.id) {
			throw new InternalServerErrorException('User or tool id is missing');
		}

		const result = await this.externalToolPseudonymRepo.findOrCreate(user.id, tool.id);

		return result;
	}

	public async findOneByPseudonym(pseudonym: string): Promise<Pseudonym | null> {
		const result = await this.externalToolPseudonymRepo.findByPseudonym(pseudonym);

		return result;
	}

	public async findPseudonym(query: PseudonymSearchQuery, options: IFindOptions<Pseudonym>): Promise<Page<Pseudonym>> {
		const result = await this.externalToolPseudonymRepo.findByQuery(query, options);

		return result;
	}

	public getIframeSubject(pseudonym: string): string {
		const iFrameSubject = `<iframe src="${this.config.hostUrl}/oauth2/username/${pseudonym}" title="username" style="height: 26px; width: 180px; border: none;"></iframe>`;

		return iFrameSubject;
	}
}
