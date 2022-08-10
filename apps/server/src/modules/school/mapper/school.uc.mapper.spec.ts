import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { SchoolUcMapper } from '@src/modules/school/mapper/school.uc.mapper';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';

describe('SchoolUcMapper', () => {
	describe('mapFromProvisioningSchoolOutputDtoToSchoolDto', () => {
		it('should map all fields', () => {
			// Arrange
			const dto: ProvisioningSchoolOutputDto = new ProvisioningSchoolOutputDto({
				name: '123',
				externalId: 'external1234',
			});

			// Act
			const result = SchoolUcMapper.mapFromProvisioningSchoolOutputDtoToSchoolDto(dto);

			// Assert
			expect(result.id).toEqual(dto.id);
			expect(result.name).toEqual(dto.name);
			expect(result.externalId).toEqual(dto.externalId);
		});
		// it('should throw error when external identifier is missing', () => {
		// 	// Arrange
		// 	const dto: ProvisioningSchoolOutputDto = new ProvisioningSchoolOutputDto({ name: '123' });
		//
		// 	// Act
		// 	const result = SchoolUcMapper.mapFromProvisioningSchoolOutputDtoToSchoolDto(dto);
		//
		// 	// Assert
		// 	expect(result.id).toEqual(dto.id);
		// 	expect(result.name).toEqual(dto.name);
		// 	expect(result.externalId).toBeUndefined();
		// });
	});
});
