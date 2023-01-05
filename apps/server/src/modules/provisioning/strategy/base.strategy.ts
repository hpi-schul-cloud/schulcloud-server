import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OauthDataAdapterInputDto, ProvisioningDto } from '../dto';
import { OauthDataDto } from '../dto/oauth-data.dto';

export abstract class ProvisioningStrategy {
	abstract getType(): SystemProvisioningStrategy;

	abstract fetch(input: OauthDataAdapterInputDto): Promise<OauthDataDto>;

	abstract apply(data: OauthDataDto): Promise<ProvisioningDto>;
}
