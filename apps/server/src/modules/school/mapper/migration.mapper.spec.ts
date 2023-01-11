import { Test, TestingModule } from '@nestjs/testing';
import { MigrationMapper } from './migration.mapper';
import { MigrationDto } from '../dto/migration.dto';
import { MigrationResponse } from '../controller/dto';

describe('MigrationMapper', () => {
	let mapper: MigrationMapper;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [MigrationMapper],
		}).compile();
		mapper = module.get(MigrationMapper);
	});

	afterAll(async () => {
		await module.close();
	});
	describe('when it maps migration data', () => {
		let dtoRef: MigrationDto;
		let responseRef: MigrationResponse;
		beforeAll(() => {
			dtoRef = new MigrationDto({
				oauthMigrationPossible: new Date(),
				oauthMigrationMandatory: new Date(),
				oauthMigrationFinished: new Date(),
				enableMigrationStart: true,
			});
			responseRef = new MigrationResponse({
				oauthMigrationPossible: new Date(),
				oauthMigrationMandatory: new Date(),
				oauthMigrationFinished: new Date(),
				enableMigrationStart: true,
			});
		});
		it('mapToDO', () => {
			const response = mapper.mapDtoToResponse(dtoRef);
			expect(response).toEqual(responseRef);
		});
	});
});
