import { SchoolUcMapper } from '@src/modules/school/mapper/school.uc.mapper';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';

describe('SchoolUcMapper', () => {
	describe('mapFromProvisioningSchoolOutputDtoToSchoolDto', () => {
		it('should map all fields', () => {
			// Arrange
			const dto: ProvisioningSchoolOutputDto = new ProvisioningSchoolOutputDto({
				name: '123',
				externalId: 'external1234',
				systemIds: ['systemId'],
			});

			// Act
			const result = SchoolUcMapper.mapFromProvisioningSchoolOutputDtoToSchoolDto(dto);

			// Assert
			expect(result.id).toEqual(dto.id);
			expect(result.name).toEqual(dto.name);
			expect(result.externalId).toEqual(dto.externalId);
			expect(result.systemIds).toEqual(dto.systemIds);
		});
	});
});
