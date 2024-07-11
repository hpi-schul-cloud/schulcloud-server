import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { systemFactory } from '@shared/testing';
import { ProvisioningSystemDto } from '../dto';
import { ProvisioningSystemInputMapper } from './provisioning-system-input.mapper';

describe('SchoolUcMapper', () => {
	describe('mapToInternal', () => {
		it('should map provisioningStrategy', () => {
			const provisioningStrategy = SystemProvisioningStrategy.SANIS;
			const system = systemFactory.build({
				provisioningStrategy,
				provisioningUrl: 'https://prov.url',
			});

			const result: ProvisioningSystemDto = ProvisioningSystemInputMapper.mapToInternal(system);

			expect(result).toEqual<ProvisioningSystemDto>({
				systemId: system.id,
				provisioningStrategy,
				provisioningUrl: system.provisioningUrl,
			});
		});

		it('should map provisioningStrategy, when input undefined', () => {
			const system = systemFactory.build({
				provisioningStrategy: undefined,
				provisioningUrl: undefined,
			});

			const result: ProvisioningSystemDto = ProvisioningSystemInputMapper.mapToInternal(system);

			expect(result).toEqual<ProvisioningSystemDto>({
				systemId: system.id,
				provisioningStrategy: SystemProvisioningStrategy.UNDEFINED,
				provisioningUrl: undefined,
			});
		});
	});
});
