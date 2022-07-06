import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { SchoolUcMapper } from '@src/modules/school/mapper/school.uc.mapper';

describe('SchoolUcMapper', () => {
	describe('mapFromProvisioningSchoolOutputDtoToSchoolDto', () => {
		it('should map all fields', () => {
			// Arrange
			const dto: SchoolDto = new SchoolDto({ name: '123' });

			// Act
			const result = SchoolUcMapper.mapFromProvisioningSchoolOutputDtoToSchoolDto(dto);

			// Assert
			expect(result.id).toEqual(dto.id);
			expect(result.name).toEqual(dto.name);
		});
	});
});
