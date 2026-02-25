import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { DeletionBatchUsersRepo } from './deletion-batch-users.repo';
import { ObjectId } from '@mikro-orm/mongodb';

describe('DeletionBatchUsersRepo', () => {
    let repo: DeletionBatchUsersRepo;
    let emMock: jest.Mocked<EntityManager>;
    let connectionMock: any;

    beforeEach(async () => {
        connectionMock = {
            aggregate: jest.fn(),
        };
        emMock = {
            getConnection: jest.fn().mockReturnValue(connectionMock),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeletionBatchUsersRepo,
                {
                    provide: EntityManager,
                    useValue: emMock,
                },
            ],
        }).compile();

        repo = module.get<DeletionBatchUsersRepo>(DeletionBatchUsersRepo);
    });

    describe('defined', () => {
        it('repo should be defined', () => {
            expect(repo).toBeDefined();
        });
    });

    describe('getUsersWithRoles', () => {
        it('should return empty array if userIds is empty', async () => {
            const result = await repo.getUsersWithRoles([]);
            expect(result).toEqual([]);
            expect(emMock.getConnection).not.toHaveBeenCalled();
        });

        it('should execute aggregate pipeline and return result', async () => {
            const validId = new ObjectId().toHexString();
            const mockResult = [{ id: validId, roles: ['student'] }];
            connectionMock.aggregate.mockResolvedValueOnce(mockResult);

            const result = await repo.getUsersWithRoles([validId]);

            expect(connectionMock.aggregate).toHaveBeenCalledWith('users', expect.any(Array));

            const pipeline = connectionMock.aggregate.mock.calls[0][1];
            expect(pipeline[0].$match._id.$in).toEqual([new ObjectId(validId)]);
            expect(result).toEqual(mockResult);
        });
    });
});
