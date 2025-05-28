import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { GroupService, GroupTypes } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MoinSchuleClassService } from './moin-schule-class.service';

describe(MoinSchuleClassService.name, () => {
	let module: TestingModule;
	let service: MoinSchuleClassService;
	let groupService: DeepMocked<GroupService>;

	beforeAll(async () => {
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
			it('should return the groups of type class for the user', async () => {
				const user = userDoFactory.buildWithId();
				const groups = groupFactory.buildList(3, { type: GroupTypes.CLASS });
				groupService.findGroups.mockResolvedValue({ data: groups, total: groups.length });

				const result = await service.findByUserId(user.id || '');

				expect(result).toEqual(groups);
				expect(groupService.findGroups).toHaveBeenCalledWith({ userId: user.id, groupTypes: [GroupTypes.CLASS] });
			});
		});
	});
});
