import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@shared/domain';
import { SchoolController } from './school.controller';
import { SchoolUc } from '../uc/school.uc';
import { MigrationBody, MigrationResponse, SchoolParams } from './dto';

describe('School Controller', () => {
	let module: TestingModule;
	let controller: SchoolController;
	let schoolUc: DeepMocked<SchoolUc>;
	let schoolParams: SchoolParams;
	let testUser: ICurrentUser;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [SchoolController],
			providers: [
				{
					provide: SchoolUc,
					useValue: createMock<SchoolUc>(),
				},
			],
		}).compile();
		controller = module.get(SchoolController);
		schoolUc = module.get(SchoolUc);
	});

	afterAll(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	const setupBasicData = () => {
		schoolParams = { schoolId: new ObjectId().toHexString() };
		testUser = { userId: 'testUser' } as ICurrentUser;
	};

	const restoreBasicSetup = () => {
		schoolParams = {} as SchoolParams;
		testUser = {} as ICurrentUser;
	};

	describe('setMigration', () => {
		it('should call UC', async () => {
			setupBasicData();
			const migrationResp: MigrationResponse = { oauthMigrationMandatory: true, oauthMigrationPossible: true };
			schoolUc.setMigration.mockResolvedValue(migrationResp);
			const body: MigrationBody = { oauthMigrationPossible: true, oauthMigrationMandatory: true };
			const res: MigrationResponse = await controller.setMigration(schoolParams, body, testUser);
			expect(schoolUc.setMigration).toHaveBeenCalled();
			expect(res).toBe(migrationResp);
			restoreBasicSetup();
		});
	});
});
