import { SchoolUcMapper } from '@src/modules/school/mapper/school.uc.mapper';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';

describe('SchoolUcMapper', () => {
	describe('mapFromProvisioningSchoolOutputDtoToSchoolDto', () => {
		it('should map all fields', () => {
			const dto: ProvisioningSchoolOutputDto = new ProvisioningSchoolOutputDto({
				name: '123',
				externalId: 'external1234',
				systemIds: ['systemId'],
			});

			const result = SchoolUcMapper.mapFromProvisioningSchoolOutputDtoToSchoolDto(dto);

			expect(result.id).toEqual(dto.id);
			expect(result.name).toEqual(dto.name);
			expect(result.externalId).toEqual(dto.externalId);
			expect(result.systemIds).toEqual(dto.systemIds);
		});
	});
});
