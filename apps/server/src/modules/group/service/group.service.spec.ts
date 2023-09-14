import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
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

			it('should return null', async () => {
				const { group } = setup();

				const result: Group | null = await service.tryFindById(group.id);

				expect(result).toBeNull();
			});
		});
	});

	describe('findClassesForSchool', () => {
		describe('when the school has groups of type class', () => {
			const setup = () => {
				const schoolId: string = new ObjectId().toHexString();
				const groups: Group[] = groupFactory.buildList(3);

				groupRepo.findClassesForSchool.mockResolvedValue(groups);

				return {
					schoolId,
					groups,
				};
			};

			it('should call the repo', async () => {
				const { schoolId } = setup();

				await service.findClassesForSchool(schoolId);

				expect(groupRepo.findClassesForSchool).toHaveBeenCalledWith(schoolId);
			});

			it('should return the groups', async () => {
				const { schoolId, groups } = setup();

				const result: Group[] = await service.findClassesForSchool(schoolId);

				expect(result).toEqual(groups);
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

	describe('findByExternalSource', () => {
		describe('when a group with the externalId exists', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findByExternalSource.mockResolvedValue(group);

				return {
					group,
				};
			};

			it('should return the group', async () => {
				const { group } = setup();

				const result: Group | null = await service.findByExternalSource('externalId', 'systemId');

				expect(result).toEqual(group);
			});
		});

		describe('when a group with the externalId does not exists', () => {
			const setup = () => {
				groupRepo.findByExternalSource.mockResolvedValue(null);
			};

			it('should return null', async () => {
				setup();

				const result: Group | null = await service.findByExternalSource('externalId', 'systemId');

				expect(result).toBeNull();
			});
		});
	});
});
