import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { School } from '@shared/domain';
import { schoolFactory } from '@shared/testing';

describe('SchoolMapper', () => {
	it('mapToDto', () => {
		// Arrange
		const schoolEntity: School = schoolFactory.buildWithId();

		// Act
		const schoolDto = SchoolMapper.mapToDto(schoolEntity);

		// Assert
		expect(schoolDto.id).toEqual(schoolEntity.id);
		expect(schoolDto.name).toEqual(schoolEntity.name);
	});

	it('mapToEntity', () => {
		// Arrange
		const schoolDto: SchoolDto = new SchoolDto({ id: 'id445894', name: 'schoolName' });

		// Act
		const entity = SchoolMapper.mapToEntity(schoolDto);

		// Assert
		expect(entity.id).toEqual(schoolDto.id);
		expect(entity.name).toEqual(schoolDto.name);
	});

	it('mapEntityToEntity', () => {
		// Arrange
		const targetEntity: School = new School({ name: 'oldName' });
		const sourceEntity: School = schoolFactory.buildWithId();

		// Act
		const entity = SchoolMapper.mapEntityToEntity(targetEntity, sourceEntity);

		// Assert
		expect(entity.id).toEqual(targetEntity.id);
		expect(entity.name).toEqual(sourceEntity.name);
	});
});
