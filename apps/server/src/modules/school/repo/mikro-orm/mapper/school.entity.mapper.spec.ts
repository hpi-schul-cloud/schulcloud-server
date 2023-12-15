import { schoolFactory } from '@shared/testing';
import { School } from '../../../domain';
import { CountyEmbeddableMapper } from './county.embeddable.mapper';
import { FederalStateEntityMapper } from './federal-state.entity.mapper';
import { SchoolYearEntityMapper } from './school-year.entity.mapper';
import { SchoolEntityMapper } from './school.entity.mapper';

describe('SchoolEntityMapper', () => {
	describe('mapToDo', () => {
		describe('when school entity is passed', () => {
			const setup = () => {
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
					enableStudentTeamCreation: entity.enableStudentTeamCreation,
					features: new Set(entity.features),
					federalState: FederalStateEntityMapper.mapToDo(entity.federalState),
					county: entity.county && CountyEmbeddableMapper.mapToDo(entity.county),
					currentYear: entity.currentYear && SchoolYearEntityMapper.mapToDo(entity.currentYear),
					systemIds: entity.systems.getItems().map((system) => system.id),
				});

				return { entity, expected };
			};

			it('should return an instance of school', () => {
				const { entity } = setup();

				const result = SchoolEntityMapper.mapToDo(entity);

				expect(result).toBeInstanceOf(School);
			});

			it('should return a school with all properties', () => {
				const { entity, expected } = setup();

				const result = SchoolEntityMapper.mapToDo(entity);

				expect(result).toEqual(expected);
			});
		});
	});
});
