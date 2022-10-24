import { ProvisioningSystemInputMapper } from '@src/modules/provisioning/mapper/provisioning-system-input.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';

describe('SchoolUcMapper', () => {
	describe('mapToInternal', () => {
		it('should map provisioningStrategy', () => {
			const dto: SystemDto = new SystemDto({
				type: '',
				provisioningStrategy: SystemProvisioningStrategy.SANIS,
				provisioningUrl: 'provisioningUrl',
			});

			const result = ProvisioningSystemInputMapper.mapToInternal(dto);

			expect(result.provisioningStrategy).toEqual(dto.provisioningStrategy);
			expect(result.provisioningUrl).toEqual(dto.provisioningUrl);
		});

		it('should map provisioningStrategy, when input undefined', () => {
			const dto: SystemDto = new SystemDto({ type: '' });

			const result = ProvisioningSystemInputMapper.mapToInternal(dto);

			expect(result.provisioningStrategy).toEqual(SystemProvisioningStrategy.UNDEFINED);
			expect(result.provisioningUrl).toBeUndefined();
		});
	});
});
