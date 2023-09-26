import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { DemoSchoolUc } from '../uc';
import { DemoSchoolController } from './demo-school.controller';
import { DemoSchoolResponse } from './dto';

describe(DemoSchoolController.name, () => {
	let module: TestingModule;
	let controller: DemoSchoolController;
	let uc: DeepMocked<DemoSchoolUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: DemoSchoolUc,
					useValue: createMock<DemoSchoolUc>(),
				},
			],
			controllers: [DemoSchoolController],
		}).compile();

		controller = module.get(DemoSchoolController);
		uc = module.get(DemoSchoolUc);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('createDemoSchool', () => {
		describe('when a demo school should be created via API call', () => {
			const setup = () => {
				const currentUser = { userId: 'userId' } as ICurrentUser;
				const ucResult = {
					id: 'aSchoolsId',
					type: 'school', // WIP: make it an enum
					key: 'my own school',
					children: [],
				} as DemoSchoolResponse;
				uc.createSchool.mockResolvedValue(ucResult);
				return { currentUser, ucResult };
			};

			it('should call uc', async () => {
				const { currentUser } = setup();

				await controller.createDemoSchool(currentUser);

				expect(uc.createSchool).toHaveBeenCalled();
			});

			it('should return a valid response', async () => {
				const { currentUser, ucResult } = setup();

				const response = await controller.createDemoSchool(currentUser);

				expect(response.constructor.name).toEqual(DemoSchoolResponse.name);
				expect(response).toEqual(
					expect.objectContaining({ id: ucResult.id, type: ucResult.type, children: ucResult.children })
				);
			});
		});
	});
});
