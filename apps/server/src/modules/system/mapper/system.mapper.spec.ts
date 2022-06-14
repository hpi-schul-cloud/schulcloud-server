import { Test, TestingModule } from '@nestjs/testing';
import { systemFactory } from '@shared/testing';
import { System } from '@shared/domain';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';

describe('system mapper', () => {
	let module: TestingModule;
	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [SystemMapper],
		}).compile();
	});

	describe('mapFromEntityToDto', () => {
		it('should map all fields', () => {
			// Arrange
			let systemEntity = systemFactory.build();

			// Act
			const result = SystemMapper.mapFromEntityToDto(systemEntity);

			// Assert
			expect(result.url).toEqual(systemEntity.url);
			expect(result.alias).toEqual(systemEntity.alias);
			expect(result.type).toEqual(systemEntity.type);
			expect(result.oauthConfig).toEqual(systemEntity.oauthConfig);
		});
	});

	describe('mapFromEntitiesToDtos', () => {
		it('should map all given entities', () => {
			// Arrange
			let systemEntities: System[] = [systemFactory.build(), systemFactory.build({ oauthConfig: undefined })];

			// Act
			const result = SystemMapper.mapFromEntitiesToDtos(systemEntities);

			// Assert
			expect(result.length).toBe(systemEntities.length);
		});
	});
});
