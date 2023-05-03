import { Test, TestingModule } from '@nestjs/testing';
import { MigrationResponse } from '../controller/dto';
import { OauthMigrationDto } from '../uc/dto/oauth-migration.dto';
import { MigrationMapper } from './migration.mapper';

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
		const setup = () => {
			const dto: OauthMigrationDto = new OauthMigrationDto({
				oauthMigrationPossible: new Date('2023-01-23T09:34:54.854Z'),
				oauthMigrationMandatory: new Date('2023-02-23T09:34:54.854Z'),
				oauthMigrationFinished: new Date('2023-03-23T09:34:54.854Z'),
				oauthMigrationFinalFinish: new Date('2023-04-23T09:34:54.854Z'),
				enableMigrationStart: true,
			});
			const response: MigrationResponse = new MigrationResponse({
				oauthMigrationPossible: new Date('2023-01-23T09:34:54.854Z'),
				oauthMigrationMandatory: new Date('2023-02-23T09:34:54.854Z'),
				oauthMigrationFinished: new Date('2023-03-23T09:34:54.854Z'),
				oauthMigrationFinalFinish: new Date('2023-04-23T09:34:54.854Z'),
				enableMigrationStart: true,
			});

			return {
				dto,
				response,
			};
		};

		it('mapToDO', () => {
			const { dto, response } = setup();

			const result: MigrationResponse = mapper.mapDtoToResponse(dto);

			expect(result).toEqual(response);
		});
	});
});
