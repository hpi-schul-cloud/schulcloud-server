import { SchoolFeature } from '@shared/domain/types';
import { schoolFactory } from '@shared/testing';
import { School } from '../../../domain';
import { CountyEmbeddableMapper } from './county.embeddable.mapper';
import { FederalStateEntityMapper } from './federal-state.entity.mapper';
import { SchoolYearEntityMapper } from './school-year.entity.mapper';
import { SchoolEntityMapper } from './school.entity.mapper';

describe('SchoolEntityMapper', () => {
	describe('mapToDo', () => {
		it('should return an instance of school', () => {
			const entity = schoolFactory.build();

			const result = SchoolEntityMapper.mapToDo(entity);

			expect(result).toBeInstanceOf(School);
		});

		it('should return a school with all properties', () => {
			const entity = schoolFactory.build();
			const expected = new School({
				id: entity.id,
				createdAt: entity.createdAt,
				updatedAt: entity.updatedAt,
				name: entity.name,
				officialSchoolNumber: entity.officialSchoolNumber,
				externalId: entity.externalId,
				previousExternalId: entity.previousExternalId,
				inMaintenanceSince: entity.inMaintenanceSince,
				inUserMigration: entity.inUserMigration,
				purpose: entity.purpose,
				logo_dataUrl: entity.logo_dataUrl,
				logo_name: entity.logo_name,
				fileStorageType: entity.fileStorageType,
				language: entity.language,
				timezone: entity.timezone,
				permissions: entity.permissions,
				features: new Set(entity.features),
				federalState: FederalStateEntityMapper.mapToDo(entity.federalState),
				county: entity.county && CountyEmbeddableMapper.mapToDo(entity.county),
				currentYear: entity.currentYear && SchoolYearEntityMapper.mapToDo(entity.currentYear),
				systemIds: entity.systems.getItems().map((system) => system.id),
			});

			const result = SchoolEntityMapper.mapToDo(entity);

			expect(result).toEqual(expected);
		});

		describe('when enableStudentTeamCreation on entity is false', () => {
			it('should return a school without IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', () => {
				const entity = schoolFactory.build({ enableStudentTeamCreation: false });

				const result = SchoolEntityMapper.mapToDo(entity);

				expect(result.getProps().features.has(SchoolFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED)).toBe(false);
			});
		});

		describe('when enableStudentTeamCreation on entity is true', () => {
			it('should return a school with IS_TEAM_CREATION_BY_STUDENTS_ENABLED feature', () => {
				const entity = schoolFactory.build({ enableStudentTeamCreation: true });

				const result = SchoolEntityMapper.mapToDo(entity);

				expect(result.getProps().features.has(SchoolFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED)).toBe(true);
			});
		});
	});
});
