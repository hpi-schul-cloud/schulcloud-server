import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { School, System } from '@shared/domain';
import { schoolFactory, setupEntities, systemFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

describe('SchoolMapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	it('mapToDto', () => {
		// Arrange
		const schoolEntity: School = schoolFactory.buildWithId();
		const system: System = systemFactory.buildWithId();
		schoolEntity.systems.add(system);

		// Act
		const schoolDto = SchoolMapper.mapToDto(schoolEntity);

		// Assert
		expect(schoolDto.id).toEqual(schoolEntity.id);
		expect(schoolDto.name).toEqual(schoolEntity.name);
		expect(schoolDto.externalId).toEqual(schoolEntity.externalId);
		expect(schoolDto.systemIds[0]).toEqual(schoolEntity.systems.getItems()[0].id);
	});

	it('mapToEntity', () => {
		// Arrange
		const system: System = systemFactory.buildWithId();

		const schoolDto: SchoolDto = new SchoolDto({
			id: new ObjectId().toHexString(),
			name: 'schoolName',
			externalId: 'externalId',
			systemIds: [system.id],
		});

		// Act
		const entity: School = SchoolMapper.mapToEntity(schoolDto);

		// Assert
		expect(entity.id).toEqual(schoolDto.id);
		expect(entity.name).toEqual(schoolDto.name);
		expect(entity.externalId).toEqual(schoolDto.externalId);
		expect(entity.systems.getItems()[0].id).toEqual(schoolDto.systemIds[0]);
	});

	it('mapEntityToEntity', () => {
		// Arrange
		const targetEntity: School = new School({ name: 'oldName' });
		const sourceEntity: School = schoolFactory.buildWithId();
		const system: System = systemFactory.buildWithId();
		sourceEntity.systems.add(system);

		// Act
		const entity = SchoolMapper.mapEntityToEntity(targetEntity, sourceEntity);

		// Assert
		expect(entity.id).toEqual(targetEntity.id);
		expect(entity.name).toEqual(sourceEntity.name);
		expect(entity.externalId).toEqual(sourceEntity.externalId);
		expect(entity.systems).toEqual(sourceEntity.systems);
	});
});
