import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities, systemFactory } from '@shared/testing';
import { System } from '@shared/domain';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

describe('system mapper', () => {
	let module: TestingModule;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterEach(async () => {
		await module.close();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [SystemMapper]
		}).compile();
	});

	describe('mapFromEntityToDto', () => {
		it('should map all fields', () => {
			// Arrange
			let systemEntity = systemFactory.build();

			// Act
			const result = SystemMapper.mapFromEntityToDto(systemEntity);

			// Assert
			expect(result instanceof SystemDto).toEqual(true);
			expect(result.url).toEqual(systemEntity.url);
			expect(result.alias).toEqual(systemEntity.alias);
			expect(result.type).toEqual(systemEntity.type);
			expect(result.oauthConfig).toEqual(systemEntity.oauthConfig);
		});
	});

	describe('mapFromEntitiesToDtos', () => {
		it('should map all given entities', () => {
			// Arrange
			let systemEntities: System[] = [
				systemFactory.build(),
				systemFactory.build({ oauthConfig: undefined })
			];

			// Act
			const result = SystemMapper.mapFromEntitiesToDtos(systemEntities);

			// Assert
			expect(result.length).toBe(systemEntities.length);
		});
	});
});
