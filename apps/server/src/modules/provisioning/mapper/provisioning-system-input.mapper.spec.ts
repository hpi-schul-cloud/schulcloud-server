import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { systemFactory } from '@shared/testing';
import { ProvisioningSystemDto } from '../dto';
import { ProvisioningSystemInputMapper } from './provisioning-system-input.mapper';

describe('SchoolUcMapper', () => {
	describe('mapToInternal', () => {
		it('should map provisioningStrategy', () => {
			const dto = systemFactory.build();

			const result: ProvisioningSystemDto = ProvisioningSystemInputMapper.mapToInternal(dto);

			expect(result).toEqual<ProvisioningSystemDto>({
				systemId: 'systemId',
				provisioningStrategy: SystemProvisioningStrategy.SANIS,
				provisioningUrl: 'provisioningUrl',
			});
		});

		it('should map provisioningStrategy, when input undefined', () => {
			const dto = systemFactory.build();

			const result: ProvisioningSystemDto = ProvisioningSystemInputMapper.mapToInternal(dto);

			expect(result).toEqual<ProvisioningSystemDto>({
				systemId: '',
				provisioningStrategy: SystemProvisioningStrategy.UNDEFINED,
				provisioningUrl: undefined,
			});
		});
	});
});
