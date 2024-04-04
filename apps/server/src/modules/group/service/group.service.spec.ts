import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { EventBus } from '@nestjs/cqrs';
import { School } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Page, UserDO } from '@shared/domain/domainobject';
import { groupFactory, userDoFactory } from '@shared/testing';
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

	describe('findGroupsByUserAndGroupTypes', () => {
		describe('when groups with the user exists', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const groups: Group[] = groupFactory.buildList(2);
				const page: Page<Group> = new Page<Group>(groups, groups.length);

				groupRepo.findByUserAndGroupTypes.mockResolvedValue(page);

				return {
					user,
					groups,
				};
			};

			it('should return the groups', async () => {
				const { user, groups } = setup();

				const result: Page<Group> = await service.findGroupsByUserAndGroupTypes(user, [GroupTypes.CLASS]);

				expect(result.data).toEqual(groups);
			});

			it('should call the repo with given group types', async () => {
				const { user } = setup();

				await service.findGroupsByUserAndGroupTypes(user, [GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER]);

				expect(groupRepo.findByUserAndGroupTypes).toHaveBeenCalledWith(
					user,
					[GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER],
					undefined
				);
			});
		});

		describe('when no groups with the user exists', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();

				groupRepo.findByUserAndGroupTypes.mockResolvedValue(new Page<Group>([], 0));

				return {
					user,
				};
			};

			it('should return empty array', async () => {
				const { user } = setup();

				const result: Page<Group> = await service.findGroupsByUserAndGroupTypes(user, [GroupTypes.CLASS]);

				expect(result.data).toEqual([]);
			});
		});
	});

	describe('findAvailableGroupByUser', () => {
		describe('when available groups exist for user', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const groups: Group[] = groupFactory.buildList(2);

				groupRepo.findAvailableByUser.mockResolvedValue(new Page<Group>([groups[1]], 1));

				return {
					user,
					groups,
				};
			};

			it('should call repo', async () => {
				const { user } = setup();

				await service.findAvailableGroupsByUser(user);

				expect(groupRepo.findAvailableByUser).toHaveBeenCalledWith(user, undefined);
			});

			it('should return groups', async () => {
				const { user, groups } = setup();

				const result: Page<Group> = await service.findAvailableGroupsByUser(user);

				expect(result.data).toEqual([groups[1]]);
			});
		});

		describe('when no groups with the user exists', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();

				groupRepo.findAvailableByUser.mockResolvedValue(new Page<Group>([], 0));

				return {
					user,
				};
			};

			it('should return empty array', async () => {
				const { user } = setup();

				const result: Page<Group> = await service.findAvailableGroupsByUser(user);

				expect(result.data).toEqual([]);
			});
		});
	});

	describe('findGroupsBySchoolIdAndGroupTypes', () => {
		describe('when the school has groups of type class', () => {
			const setup = () => {
				const school: School = schoolFactory.build();
				const groups: Group[] = groupFactory.buildList(3);
				const page: Page<Group> = new Page<Group>(groups, groups.length);

				groupRepo.findBySchoolIdAndGroupTypes.mockResolvedValue(page);

				return {
					school,
					groups,
				};
			};

			it('should call the repo', async () => {
				const { school } = setup();

				await service.findGroupsBySchoolIdAndGroupTypes(school, [
					GroupTypes.CLASS,
					GroupTypes.COURSE,
					GroupTypes.OTHER,
				]);

				expect(groupRepo.findBySchoolIdAndGroupTypes).toHaveBeenCalledWith(
					school,
					[GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER],
					undefined
				);
			});

			it('should return the groups', async () => {
				const { school, groups } = setup();

				const result: Page<Group> = await service.findGroupsBySchoolIdAndGroupTypes(school, [GroupTypes.CLASS]);

				expect(result.data).toEqual(groups);
			});
		});
	});

	describe('findAvailableGroupBySchoolId', () => {
		describe('when available groups exist for school', () => {
			const setup = () => {
				const school: School = schoolFactory.build();
				const groups: Group[] = groupFactory.buildList(2);

				groupRepo.findAvailableBySchoolId.mockResolvedValue(new Page<Group>([groups[1]], 1));

				return {
					school,
					groups,
				};
			};

			it('should call repo', async () => {
				const { school } = setup();

				await service.findAvailableGroupsBySchoolId(school);

				expect(groupRepo.findAvailableBySchoolId).toHaveBeenCalledWith(school, undefined);
			});

			it('should return groups', async () => {
				const { school, groups } = setup();

				const result: Page<Group> = await service.findAvailableGroupsBySchoolId(school);

				expect(result.data).toEqual([groups[1]]);
			});
		});

		describe('when no groups with the user exists', () => {
			const setup = () => {
				const school: School = schoolFactory.build();

				groupRepo.findAvailableBySchoolId.mockResolvedValue(new Page<Group>([], 0));

				return {
					school,
				};
			};

			it('should return empty array', async () => {
				const { school } = setup();

				const result: Page<Group> = await service.findAvailableGroupsBySchoolId(school);

				expect(result.data).toEqual([]);
			});
		});
	});

	describe('findGroupsBySchoolIdAndSystemIdAndGroupType', () => {
		describe('when the school has groups of type class', () => {
			const setup = () => {
				const schoolId: string = new ObjectId().toHexString();
				const systemId: string = new ObjectId().toHexString();
				const groups: Group[] = groupFactory.buildList(3);

				groupRepo.findGroupsBySchoolIdAndSystemIdAndGroupType.mockResolvedValue(groups);

				return {
					schoolId,
					systemId,
					groups,
				};
			};

			it('should search for the groups', async () => {
				const { schoolId, systemId } = setup();

				await service.findGroupsBySchoolIdAndSystemIdAndGroupType(schoolId, systemId, GroupTypes.CLASS);

				expect(groupRepo.findGroupsBySchoolIdAndSystemIdAndGroupType).toHaveBeenCalledWith(
					schoolId,
					systemId,
					GroupTypes.CLASS
				);
			});

			it('should return the groups', async () => {
				const { schoolId, systemId, groups } = setup();

				const result: Group[] = await service.findGroupsBySchoolIdAndSystemIdAndGroupType(
					schoolId,
					systemId,
					GroupTypes.CLASS
				);

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
