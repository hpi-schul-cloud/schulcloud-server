import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto } from '../dto';

export abstract class ProvisioningStrategy {
	public abstract getType(): SystemProvisioningStrategy;

	public abstract getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto>;

	public abstract apply(data: OauthDataDto): Promise<ProvisioningDto>;
}
