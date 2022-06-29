import { ProvisioningSystemInputMapper } from '@src/modules/provisioning/mapper/provisioning-system-input.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';

describe('SchoolUcMapper', () => {
	describe('mapToInternal', () => {
		it('should map provisioningStrategy', () => {
			// Arrange
			const dto: SystemDto = new SystemDto({ type: '', provisioningStrategy: SystemProvisioningStrategy.UNKNOWN });

			// Act
			const result = ProvisioningSystemInputMapper.mapToInternal(dto);

			// Assert
			expect(result.provisioningStrategy).toEqual(dto.provisioningStrategy);
		});

		it('should map provisioningStrategy, when input undefined', () => {
			// Arrange
			const dto: SystemDto = new SystemDto({ type: '' });

			// Act
			const result = ProvisioningSystemInputMapper.mapToInternal(dto);

			// Assert
			expect(result.provisioningStrategy).toEqual(SystemProvisioningStrategy.UNDEFINED);
		});
	});
});
