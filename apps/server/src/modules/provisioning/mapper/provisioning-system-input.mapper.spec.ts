import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { ProvisioningSystemDto } from '../dto';
import { ProvisioningSystemInputMapper } from './provisioning-system-input.mapper';

describe('SchoolUcMapper', () => {
	describe('mapToInternal', () => {
		it('should map provisioningStrategy', () => {
			const dto: SystemDto = new SystemDto({
				id: 'systemId',
				type: '',
				provisioningStrategy: SystemProvisioningStrategy.SANIS,
				provisioningUrl: 'provisioningUrl',
			});

			const result: ProvisioningSystemDto = ProvisioningSystemInputMapper.mapToInternal(dto);

			expect(result).toEqual<ProvisioningSystemDto>({
				systemId: 'systemId',
				provisioningStrategy: SystemProvisioningStrategy.SANIS,
				provisioningUrl: 'provisioningUrl',
			});
		});

		it('should map provisioningStrategy, when input undefined', () => {
			const dto: SystemDto = new SystemDto({ type: '' });

			const result: ProvisioningSystemDto = ProvisioningSystemInputMapper.mapToInternal(dto);

			expect(result).toEqual<ProvisioningSystemDto>({
				systemId: '',
				provisioningStrategy: SystemProvisioningStrategy.UNDEFINED,
				provisioningUrl: undefined,
			});
		});
	});
});
