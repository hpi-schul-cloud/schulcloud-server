import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { PublicSchoolResponse } from '../controller/dto/public.school.response';
import { SchoolUcMapper } from './school.uc.mapper';

describe('SchoolUcMapper', () => {
	describe('when it maps from a SchoolDO to a PublicSchoolResponse', () => {
		it('should map all fields', () => {
			const schoolDO: SchoolDO = new SchoolDO({
				name: 'Testschool',
				officialSchoolNumber: '1234',
				oauthMigrationPossible: new Date(),
				oauthMigrationMandatory: new Date(),
			});

			const result: PublicSchoolResponse = SchoolUcMapper.mapDOToPublicResponse(schoolDO);

			expect(result.schoolName).toEqual(schoolDO.name);
			expect(result.schoolNumber).toEqual(schoolDO.officialSchoolNumber);
			expect(result.oauthMigrationPossible).toBeTruthy();
			expect(result.oauthMigrationMandatory).toBeTruthy();
		});
	});
});
