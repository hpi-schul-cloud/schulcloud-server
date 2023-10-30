import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OauthDataStrategyInputDto } from '../dto/oauth-data-strategy-input.dto';
import { OauthDataDto } from '../dto/oauth-data.dto';
import { ProvisioningDto } from '../dto/provisioning.dto';

export abstract class ProvisioningStrategy {
	abstract getType(): SystemProvisioningStrategy;

	abstract getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto>;

	abstract apply(data: OauthDataDto): Promise<ProvisioningDto>;
}
