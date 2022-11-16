import { Inject, Injectable } from '@nestjs/common';
import {
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool.do';
import { ExternalToolDORepo } from '@shared/repo/externaltool/external-tool-do.repo';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';

@Injectable()
export class ExternalToolService {
	constructor(
		private externalToolRepo: ExternalToolDORepo,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: IEncryptionService
	) {}

	async createExternalTool(externalToolDO: ExternalToolDO): Promise<ExternalToolDO> {
		const externalTool: ExternalToolDO = await this.externalToolRepo.save(externalToolDO);
		return externalTool;
	}

	isNameUnique(externalToolDO: ExternalToolDO): boolean {
		const duplicate = this.externalToolRepo.findByName(externalToolDO.name);
		return duplicate !== null;
	}

	isClientIdUnique(externalToolDO: ExternalToolDO): boolean {
		const duplicate = this.externalToolRepo.findByOAuth2ConfigClientId(externalToolDO.config as Oauth2ToolConfigDO);
		return duplicate !== null;
	}

	hasDuplicateAttributes(customParameter: CustomParameterDO[]): boolean {
		return customParameter.some((item) => {
			return customParameter.some((other) => item.name === other.name);
		});
	}

	encryptSecrets(externalToolDO: ExternalToolDO): void {
		if (externalToolDO.config instanceof Lti11ToolConfigDO) {
			externalToolDO.config.secret = this.oAuthEncryptionService.encrypt(externalToolDO.config.secret);
		} else if (externalToolDO.config instanceof Oauth2ToolConfigDO) {
			externalToolDO.config.clientSecret = this.oAuthEncryptionService.encrypt(externalToolDO.config.clientSecret);
		}
	}
}
