import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { groupFactory } from '@shared/testing';
import { Group } from '../domain';
import { GroupRepo } from '../repo';
import { GroupService } from './group.service';

describe('GroupService', () => {
	let module: TestingModule;
	let service: GroupService;

	let groupRepo: DeepMocked<GroupRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				GroupService,
				{
					provide: GroupRepo,
					useValue: createMock<GroupRepo>(),
				},
			],
		}).compile();

		service = module.get(GroupService);
		groupRepo = module.get(GroupRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findById', () => {
		describe('when a group with the id exists', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findById.mockResolvedValue(group);

				return {
					group,
				};
			};

			it('should return the group', async () => {
				const { group } = setup();

				const result: Group = await service.findById(group.id);

				expect(result).toEqual(group);
			});
		});

		describe('when a group with the id does not exists', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findById.mockResolvedValue(null);

				return {
					group,
				};
			};

			it('should throw NotFoundLoggableException', async () => {
				const { group } = setup();

				const func = () => service.findById(group.id);

				await expect(func).rejects.toThrow(NotFoundLoggableException);
			});
		});
	});

	describe('tryFindById', () => {
		describe('when a group with the id exists', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findById.mockResolvedValue(group);

				return {
					group,
				};
			};

			it('should return the group', async () => {
				const { group } = setup();

				const result: Group | null = await service.tryFindById(group.id);

				expect(result).toEqual(group);
			});
		});

		describe('when a group with the id does not exists', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findById.mockResolvedValue(null);

				return {
					group,
				};
			};

			it('should throw NotFoundLoggableException', async () => {
				const { group } = setup();

				const result: Group | null = await service.tryFindById(group.id);

				expect(result).toBeNull();
			});
		});
	});

	describe('save', () => {
		describe('when saving a group', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.save.mockResolvedValue(group);

				return {
					group,
				};
			};

			it('should call repo.save', async () => {
				const { group } = setup();

				await service.save(group);

				expect(groupRepo.save).toHaveBeenCalledWith(group);
			});

			it('should return the group', async () => {
				const { group } = setup();

				const result: Group | null = await service.save(group);

				expect(result).toEqual(group);
			});
		});
	});

	describe('delete', () => {
		describe('when saving a group', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				return {
					group,
				};
			};

			it('should call repo.delete', async () => {
				const { group } = setup();

				await service.delete(group);

				expect(groupRepo.delete).toHaveBeenCalledWith(group);
			});
		});
	});
});
