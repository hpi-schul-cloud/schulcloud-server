import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { OauthProvisioningInputDto, ProvisioningDataResponseDto } from '../dto';

export abstract class ProvisioningStrategy<T extends ProvisioningDataResponseDto> {
	abstract getType(): SystemProvisioningStrategy;

	abstract fetch(input :OauthProvisioningInputDto): Promise<T>;

	abstract apply(data: T): Promise<ProvisioningDto>;
}
