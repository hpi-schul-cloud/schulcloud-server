import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { NotImplementedException } from '@nestjs/common';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';

export abstract class ProvisioningStrategy<T> {
	abstract getType(): SystemProvisioningStrategy;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
	async apply(params: T): Promise<ProvisioningDto> {
		throw new NotImplementedException();
	}
}
