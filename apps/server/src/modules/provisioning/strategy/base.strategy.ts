import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto } from '../dto';

export abstract class ProvisioningStrategy {
	abstract getType(): SystemProvisioningStrategy;

	abstract getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto>;

	abstract apply(data: OauthDataDto): Promise<ProvisioningDto>;
}
