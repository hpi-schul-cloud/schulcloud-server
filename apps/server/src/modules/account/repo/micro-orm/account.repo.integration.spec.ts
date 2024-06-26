import { MongoMemoryDatabaseModule } from '@infra/database';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { cleanupCollections, userFactory } from '@shared/testing';
import { AccountEntity } from '../../domain/entity/account.entity';
import { accountDoFactory, accountFactory } from '../../testing';
import { AccountRepo } from './account.repo';
import { AccountEntityToDoMapper } from './mapper';
import { AccountDoToEntityMapper } from './mapper/account-do-to-entity.mapper';

describe('account repo', () => {
	let module: TestingModule;
	let em: EntityManager;
	let repo: AccountRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [AccountRepo],
		}).compile();
		repo = module.get(AccountRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(AccountEntity);
	});

	describe('save', () => {
		describe('When an account is given', () => {
			it('should save an account', async () => {
				const account = accountDoFactory.build();

				await repo.save(account);

				const foundAccount = await repo.findById(account.id);
				expect(foundAccount).toBeDefined();
			});
		});

		describe('When an existing account is given', () => {
			const setup = async () => {
				const account = accountFactory.build();
				await em.persistAndFlush(account);
				em.clear();
				return account;
			};

			it('should update the account', async () => {
				const account = await setup();

				const updatedAccount = accountDoFactory.build({ id: account.id });
				await repo.save(updatedAccount);

				const foundAccount = await repo.findById(account.id);
				expect(foundAccount?.username).toBe(updatedAccount.username);
			});
		});
	});

	describe('findById', () => {
		describe('When the account exists', () => {
			const setup = async () => {
				const account = accountFactory.build();
				await em.persistAndFlush(account);
				em.clear();
				return account;
			};

			it('should find it by id', async () => {
				const account = await setup();
				const foundAccount = await repo.findById(account.id);
				expect(foundAccount.id).toEqual(account.id);
			});
		});

		describe('When the account does not exist', () => {
			it('should throw not found error', async () => {
				await expect(repo.findById('000')).rejects.toThrow(NotFoundError);
			});
		});
	});

	describe('findByUserId', () => {
		describe('When calling findByUserId with id', () => {
			const setup = async () => {
				const accountToFind = accountFactory.build();
				await em.persistAndFlush(accountToFind);
				em.clear();
				return accountToFind;
			};

			it('should find user with id', async () => {
				const accountToFind = await setup();
				const account = await repo.findByUserId(accountToFind.userId ?? '');
				expect(account?.id).toEqual(accountToFind.id);
			});
		});

		describe('When id does not exist', () => {
			it('should return null', async () => {
				const account = await repo.findByUserId(new ObjectId().toHexString());
				expect(account).toBeNull();
			});
		});
	});

	describe('findByUsername', () => {
		describe('When username is given', () => {
			const setup = async () => {
				const accountToFind = accountFactory.build();

				await em.persistAndFlush(accountToFind);
				em.clear();

				return accountToFind;
			};

			it('should find user by username', async () => {
				const accountToFind = await setup();

				const account = await repo.findByUsername(accountToFind.username);

				expect(account?.username).toEqual(accountToFind.username);
			});
		});

		describe('When username is not given', () => {
			it('should return null', async () => {
				const account = await repo.findByUsername('');

				expect(account).toBeNull();
			});
		});
	});

	describe('findByUsernameAndSystemId', () => {
		describe('When username and systemId are given', () => {
			const setup = async () => {
				const accountToFind = accountFactory.withSystemId(new ObjectId(10)).build();
				await em.persistAndFlush(accountToFind);
				em.clear();
				return accountToFind;
			};

			it('should return account', async () => {
				const accountToFind = await setup();
				const account = await repo.findByUsernameAndSystemId(accountToFind.username, accountToFind.systemId ?? '');
				expect(account?.username).toEqual(accountToFind.username);
			});
		});

		describe('When username and systemId are not given', () => {
			it('should return null', async () => {
				const account = await repo.findByUsernameAndSystemId('', new ObjectId(undefined));
				expect(account).toBeNull();
			});
		});
	});

	describe('findMultipleByUserId', () => {
		describe('When multiple user ids are given', () => {
			const setup = async () => {
				const anAccountToFind = accountDoFactory.build({
					userId: new ObjectId().toHexString(),
				});
				const anotherAccountToFind = accountDoFactory.build({
					userId: new ObjectId().toHexString(),
				});

				await em.persistAndFlush(AccountDoToEntityMapper.mapToEntity(anAccountToFind));
				await em.persistAndFlush(AccountDoToEntityMapper.mapToEntity(anotherAccountToFind));
				em.clear();

				return { anAccountToFind, anotherAccountToFind };
			};

			it('should find multiple users', async () => {
				const { anAccountToFind, anotherAccountToFind } = await setup();
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const accounts = await repo.findMultipleByUserId([anAccountToFind.userId!, anotherAccountToFind.userId!]);

				expect(accounts).toHaveLength(2);
				expect(accounts).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ ...anAccountToFind.getProps() }),
						expect.objectContaining({ ...anotherAccountToFind.getProps() }),
					])
				);
			});
		});

		describe('When not existing user ids are given', () => {
			it('should return empty list', async () => {
				const accounts = await repo.findMultipleByUserId(['123456789012', '098765432101']);
				expect(accounts).toHaveLength(0);
			});
		});
	});

	describe('findByUserIdOrFail', () => {
		describe('When existing id is given', () => {
			const setup = async () => {
				const accountToFind = accountFactory.build();
				await em.persistAndFlush(accountToFind);
				em.clear();
				return accountToFind;
			};

			it('should find a user', async () => {
				const accountToFind = await setup();
				const account = await repo.findByUserIdOrFail(accountToFind.userId ?? '');
				expect(account.id).toEqual(accountToFind.id);
			});
		});

		describe('When id does not exist', () => {
			it('should throw not found error', async () => {
				await expect(repo.findByUserIdOrFail('123456789012')).rejects.toThrow(NotFoundError);
			});
		});
	});

	describe('getObjectReference', () => {
		describe('When a user id is given', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const account = accountFactory.build({ userId: user.id });
				await em.persistAndFlush([user, account]);
				return { user, account };
			};

			it('should return a valid reference', async () => {
				const { user, account } = await setup();

				const reference = repo.getObjectReference(User, account.userId ?? '');

				expect(reference).toBe(user);
			});
		});
	});

	describe('saveWithoutFlush', () => {
		describe('When calling saveWithoutFlush', () => {
			const setup = () => {
				const account = accountDoFactory.build();
				return account;
			};

			it('should add an account to the persist stack', async () => {
				const account = setup();

				await repo.saveWithoutFlush(account);
				expect(em.getUnitOfWork().getPersistStack().size).toBe(1);
			});
		});
		describe('When an account is updated', () => {
			const setup = async () => {
				const account = accountFactory.build();
				await em.persistAndFlush(account);
				em.clear();
				return account;
			};

			it('should add it to the change set', async () => {
				const account = await setup();

				const updatedAccount = accountDoFactory.build({ id: account.id });
				await repo.saveWithoutFlush(updatedAccount);

				em.getUnitOfWork().computeChangeSets();
				expect(em.getUnitOfWork().getChangeSets().length).toBe(1);
			});
		});
	});

	describe('flush', () => {
		describe('When repo is flushed', () => {
			const setup = () => {
				const account = accountFactory.build();
				em.persist(account);
				return account;
			};

			it('should save account', async () => {
				const account = setup();

				expect(account.id).toBeNull();

				await repo.flush();

				expect(account.id).not.toBeNull();
			});
		});
	});

	describe('searchByUsernamePartialMatch', () => {
		describe('When searching with a partial user name', () => {
			const setup = async () => {
				const originalUsername = 'USER@EXAMPLE.COM';
				const partialUsername = 'user';
				const account = accountFactory.build({ username: originalUsername });
				await em.persistAndFlush([account]);
				em.clear();
				return { originalUsername, partialUsername, account };
			};

			it('should find exact one user', async () => {
				const { originalUsername, partialUsername } = await setup();
				const [result] = await repo.searchByUsernamePartialMatch(partialUsername);
				expect(result).toHaveLength(1);
				expect(result[0]).toEqual(expect.objectContaining({ username: originalUsername }));
			});
		});
	});

	describe('searchByUsernameExactMatch', () => {
		describe('When searching for an exact match', () => {
			const setup = async () => {
				const originalUsername = 'USER@EXAMPLE.COM';
				const account = accountFactory.build({ username: originalUsername });
				await em.persistAndFlush([account]);
				em.clear();
				return { originalUsername, account };
			};

			it('should find exact one account', async () => {
				const { originalUsername } = await setup();

				const [result] = await repo.searchByUsernameExactMatch(originalUsername);
				expect(result).toHaveLength(1);
				expect(result[0]).toEqual(expect.objectContaining({ username: originalUsername }));
			});
		});

		describe('When searching by username', () => {
			const setup = async () => {
				const originalUsername = 'USER@EXAMPLE.COM';
				const partialLowerCaseUsername = 'USER@example.COM';
				const lowercaseUsername = 'user@example.com';
				const account = accountFactory.build({ username: originalUsername });
				await em.persistAndFlush([account]);
				em.clear();
				return { originalUsername, partialLowerCaseUsername, lowercaseUsername, account };
			};

			it('should find account by user name, ignoring case', async () => {
				const { originalUsername, partialLowerCaseUsername, lowercaseUsername } = await setup();

				let [accounts] = await repo.searchByUsernameExactMatch(partialLowerCaseUsername);
				expect(accounts).toHaveLength(1);
				expect(accounts[0]).toEqual(expect.objectContaining({ username: originalUsername }));

				[accounts] = await repo.searchByUsernameExactMatch(lowercaseUsername);
				expect(accounts).toHaveLength(1);
				expect(accounts[0]).toEqual(expect.objectContaining({ username: originalUsername }));
			});
		});

		describe('When using wildcard', () => {
			const setup = async () => {
				const originalUsername = 'USER@EXAMPLE.COM';
				const missingDotUserName = 'USER@EXAMPLECCOM';
				const wildcard = '.*';
				const account = accountFactory.build({ username: originalUsername });
				await em.persistAndFlush([account]);
				em.clear();
				return { originalUsername, missingDotUserName, wildcard, account };
			};

			it('should not find account', async () => {
				const { missingDotUserName, wildcard } = await setup();

				let [accounts] = await repo.searchByUsernameExactMatch(missingDotUserName);
				expect(accounts).toHaveLength(0);

				[accounts] = await repo.searchByUsernameExactMatch(wildcard);
				expect(accounts).toHaveLength(0);
			});
		});
	});

	describe('deleteById', () => {
		describe('When an id is given', () => {
			const setup = async () => {
				const account = accountFactory.buildWithId();
				await em.persistAndFlush([account]);

				return account;
			};

			it('should delete an account by id', async () => {
				const account = await setup();

				await expect(repo.deleteById(account.id)).resolves.not.toThrow();

				await expect(repo.findById(account.id)).rejects.toThrow(NotFoundError);
			});
		});
	});

	describe('deleteByUserId', () => {
		describe('When an user id is given', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const account = accountFactory.build({ userId: user.id });
				await em.persistAndFlush([user, account]);

				return { user, account };
			};

			it('should delete an account by user id', async () => {
				const { user, account } = await setup();

				await expect(repo.deleteByUserId(user.id)).resolves.not.toThrow();

				await expect(repo.findById(account.id)).rejects.toThrow(NotFoundError);
			});
		});

		describe('When account is not deleted', () => {
			it('should return empty list', async () => {
				const accounts = await repo.deleteByUserId(new ObjectId().toHexString());
				expect(accounts).toHaveLength(0);
			});
		});
	});

	describe('findMany', () => {
		describe('When no limit and offset are given', () => {
			const setup = async () => {
				const mockAccounts = [
					accountFactory.build({ username: 'John Doe' }),
					accountFactory.build({ username: 'Marry Doe' }),
					accountFactory.build({ username: 'Susi Doe' }),
					accountFactory.build({ username: 'Tim Doe' }),
				];
				await em.persistAndFlush(mockAccounts);
				return mockAccounts;
			};

			it('should find all accounts', async () => {
				const mockAccounts = await setup();
				const foundAccounts = await repo.findMany();
				expect(foundAccounts).toEqual(AccountEntityToDoMapper.mapEntitiesToDos(mockAccounts));
			});
		});

		describe('When limit is given', () => {
			const setup = async () => {
				const limit = 1;

				const mockAccounts = [
					accountFactory.build({ username: 'John Doe' }),
					accountFactory.build({ username: 'Marry Doe' }),
					accountFactory.build({ username: 'Susi Doe' }),
					accountFactory.build({ username: 'Tim Doe' }),
				];
				await em.persistAndFlush(mockAccounts);
				return { limit, mockAccounts };
			};

			it('should limit the result set', async () => {
				const { limit } = await setup();
				const foundAccounts = await repo.findMany(0, limit);
				expect(foundAccounts).toHaveLength(limit);
			});
		});

		describe('When offset is given', () => {
			const setup = async () => {
				const offset = 2;

				const mockAccounts = [
					accountFactory.build({ username: 'John Doe' }),
					accountFactory.build({ username: 'Marry Doe' }),
					accountFactory.build({ username: 'Susi Doe' }),
					accountFactory.build({ username: 'Tim Doe' }),
				];
				await em.persistAndFlush(mockAccounts);
				return { offset, mockAccounts };
			};

			it('should skip n entries', async () => {
				const { offset, mockAccounts } = await setup();

				const foundAccounts = await repo.findMany(offset);
				expect(foundAccounts).toHaveLength(mockAccounts.length - offset);
			});
		});
	});

	describe('findByUserIdsAndSystemId', () => {
		describe('when accounts exist', () => {
			const setup = async () => {
				const systemId = new ObjectId().toHexString();
				const userAId = new ObjectId().toHexString();
				const userBId = new ObjectId().toHexString();
				const userCId = new ObjectId().toHexString();

				const accountA = accountFactory.withSystemId(systemId).build({ userId: userAId });
				const accountB = accountFactory.withSystemId(systemId).build({ userId: userBId });
				const accountC = accountFactory.withSystemId(new ObjectId().toHexString()).build({ userId: userCId });

				await em.persistAndFlush([accountA, accountB, accountC]);
				em.clear();

				const userIds = [userAId, userBId, userCId];
				const expectedUserIds = [userAId, userBId];

				return {
					expectedUserIds,
					systemId,
					userIds,
				};
			};

			it('should return array of verified userIds', async () => {
				const { expectedUserIds, systemId, userIds } = await setup();

				const verifiedUserIds = await repo.findByUserIdsAndSystemId(userIds, systemId);

				expect(verifiedUserIds).toEqual(expectedUserIds);
			});
		});

		describe('when accounts do not exist', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const userAId = new ObjectId().toHexString();
				const userBId = new ObjectId().toHexString();

				const userIds = [userAId, userBId];

				return {
					systemId,
					userIds,
				};
			};

			it('should return empty array', async () => {
				const { systemId, userIds } = setup();

				const result = await repo.findByUserIdsAndSystemId(userIds, systemId);

				expect(result).toHaveLength(0);
			});
		});
	});
});
