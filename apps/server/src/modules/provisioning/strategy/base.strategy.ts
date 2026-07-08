import { type SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { type OauthDataDto, type OauthDataStrategyInputDto, type ProvisioningDto } from '../dto';

export abstract class ProvisioningStrategy {
	public abstract getType(): SystemProvisioningStrategy;

	public abstract getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto>;

	public abstract apply(data: OauthDataDto): Promise<ProvisioningDto>;
}
