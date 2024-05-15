import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Page } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { groupFactory } from '@shared/testing';
import { Group, GroupDeletedEvent, GroupTypes } from '../domain';
import { GroupRepo } from '../repo';
import { GroupService } from './group.service';

describe('GroupService', () => {
	let module: TestingModule;
	let service: GroupService;

	let groupRepo: DeepMocked<GroupRepo>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				GroupService,
				{
					provide: GroupRepo,
					useValue: createMock<GroupRepo>(),
				},
				{
					provide: EventBus,
					useValue: createMock<EventBus>(),
				},
			],
		}).compile();

		service = module.get(GroupService);
		groupRepo = module.get(GroupRepo);
		eventBus = module.get(EventBus);
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

				groupRepo.findGroupById.mockResolvedValue(group);

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

				groupRepo.findGroupById.mockResolvedValue(null);

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

				groupRepo.findGroupById.mockResolvedValue(group);

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

				groupRepo.findGroupById.mockResolvedValue(null);

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

	describe('findGroups', () => {
		describe('when groups exist', () => {
			const setup = () => {
				const userId: EntityId = new ObjectId().toHexString();
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();
				const nameQuery = 'name';
				const groups: Group[] = groupFactory.buildList(2);
				const page: Page<Group> = new Page<Group>(groups, groups.length);

				groupRepo.findGroups.mockResolvedValue(page);

				return {
					userId,
					schoolId,
					systemId,
					nameQuery,
					groups,
				};
			};

			it('should return the groups for the user', async () => {
				const { userId, groups } = setup();

				const result: Page<Group> = await service.findGroups({ userId });

				expect(result.data).toEqual(groups);
			});

			it('should return the groups for school', async () => {
				const { schoolId, groups } = setup();

				const result: Page<Group> = await service.findGroups({ schoolId });

				expect(result.data).toEqual(groups);
			});

			it('should return the groups for school and system', async () => {
				const { schoolId, systemId, groups } = setup();

				const result: Page<Group> = await service.findGroups({ schoolId, systemId });

				expect(result.data).toEqual(groups);
			});

			it('should call the repo with all given arguments', async () => {
				const { userId, schoolId, systemId, nameQuery } = setup();

				await service.findGroups({
					userId,
					schoolId,
					systemId,
					nameQuery,
					groupTypes: [GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER],
				});

				expect(groupRepo.findGroups).toHaveBeenCalledWith(
					{
						userId,
						schoolId,
						systemId,
						nameQuery,
						groupTypes: [GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER],
					},
					undefined
				);
			});
		});

		describe('when no groups exist', () => {
			const setup = () => {
				const userId: EntityId = new ObjectId().toHexString();
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();

				groupRepo.findGroups.mockResolvedValue(new Page<Group>([], 0));

				return {
					userId,
					schoolId,
					systemId,
				};
			};

			it('should return empty array for user', async () => {
				const { userId } = setup();

				const result: Page<Group> = await service.findGroups({ userId });

				expect(result.data).toEqual([]);
			});

			it('should return empty array for school', async () => {
				const { schoolId } = setup();

				const result: Page<Group> = await service.findGroups({ schoolId });

				expect(result.data).toEqual([]);
			});

			it('should return empty array for school and system', async () => {
				const { schoolId, systemId } = setup();

				const result: Page<Group> = await service.findGroups({ schoolId, systemId });

				expect(result.data).toEqual([]);
			});
		});
	});

	describe('findAvailableGroups', () => {
		describe('when available groups exist', () => {
			const setup = () => {
				const userId: EntityId = new ObjectId().toHexString();
				const schoolId: EntityId = new ObjectId().toHexString();
				const nameQuery = 'name';
				const groups: Group[] = groupFactory.buildList(2);

				groupRepo.findAvailableGroups.mockResolvedValue(new Page<Group>([groups[1]], 1));

				return {
					userId,
					schoolId,
					nameQuery,
					groups,
				};
			};

			it('should return groups for user', async () => {
				const { userId, groups } = setup();

				const result: Page<Group> = await service.findAvailableGroups({ userId });

				expect(result.data).toEqual([groups[1]]);
			});

			it('should return groups for school', async () => {
				const { schoolId, groups } = setup();

				const result: Page<Group> = await service.findAvailableGroups({ schoolId });

				expect(result.data).toEqual([groups[1]]);
			});

			it('should call repo', async () => {
				const { userId, schoolId, nameQuery } = setup();

				await service.findAvailableGroups({ userId, schoolId, nameQuery });

				expect(groupRepo.findAvailableGroups).toHaveBeenCalledWith({ userId, schoolId, nameQuery }, undefined);
			});
		});

		describe('when no groups exist', () => {
			const setup = () => {
				const userId: EntityId = new ObjectId().toHexString();
				const schoolId: EntityId = new ObjectId().toHexString();

				groupRepo.findAvailableGroups.mockResolvedValue(new Page<Group>([], 0));

				return {
					userId,
					schoolId,
				};
			};

			it('should return empty array for user', async () => {
				const { userId } = setup();

				const result: Page<Group> = await service.findAvailableGroups({ userId });

				expect(result.data).toEqual([]);
			});

			it('should return empty array for school', async () => {
				const { schoolId } = setup();

				const result: Page<Group> = await service.findAvailableGroups({ schoolId });

				expect(result.data).toEqual([]);
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
		describe('when deleting a group', () => {
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

			it('should send an event', async () => {
				const { group } = setup();

				await service.delete(group);

				expect(eventBus.publish).toHaveBeenCalledWith(new GroupDeletedEvent(group));
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
