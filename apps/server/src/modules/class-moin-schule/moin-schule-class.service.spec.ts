import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { GroupService, GroupTypes } from '@modules/group';
import { MoinSchuleClassService } from './moin-schule-class.service';
import { setupEntities } from '@testing/database';
import { GroupEntity } from '@modules/group/entity';
import { groupFactory } from '@modules/group/testing';

describe(MoinSchuleClassService.name, () => {
	let module: TestingModule;
	let service: MoinSchuleClassService;
	let groupService: DeepMocked<GroupService>;

	beforeAll(async () => {
		await setupEntities([GroupEntity]);
		module = await Test.createTestingModule({
			providers: [
				MoinSchuleClassService,
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
			],
		}).compile();

		service = module.get(MoinSchuleClassService);
		groupService = module.get(GroupService);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findByUserId', () => {
		describe('when the user has groups of type class', () => {
			const groups = groupFactory.buildList(3, { type: GroupTypes.CLASS });
		});

		describe('when the user has no groups', () => {
			// Add your test cases here
		});
	});
});
