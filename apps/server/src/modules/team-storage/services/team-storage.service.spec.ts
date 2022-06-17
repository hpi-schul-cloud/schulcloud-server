import {Test, TestingModule} from "@nestjs/testing";
import {TeamStorageService} from "@src/modules/team-storage/services/team-storage.service";
import {RoleRepo, TeamsRepo} from "@shared/repo";
import {createMock, DeepMocked} from "@golevelup/ts-jest";
import {teamFactory} from "@shared/testing/factory/team.factory";
import {EntityId, Role, RoleName, Team} from "@shared/domain";
import {roleFactory} from "@shared/testing";
import {TeamStorageAdapter} from "@shared/infra/team-storage";
import {TeamMapper} from "@src/modules/team-storage/mapper/team.mapper";
import {RoleMapper} from "@src/modules/team-storage/mapper/role.mapper";
import {ForbiddenException} from "@nestjs/common";

describe('Team Storage Service', () => {
    let module: TestingModule;
    let service: TeamStorageService;
    let adapter: DeepMocked<TeamStorageAdapter>
    let roleRepo: DeepMocked<RoleRepo>;
    let teamsRepo: DeepMocked<TeamsRepo>;
    let roleMapper: RoleMapper;
    let teamMapper: TeamMapper;
    let mockId: string;

    beforeAll(async () => {
        [module] = await Promise.all([Test.createTestingModule({
            providers: [
                TeamStorageService,
                TeamMapper,
                RoleMapper,
                {
                    provide: RoleRepo,
                    useValue: {
                        findById: jest.fn().mockImplementation((roleId: EntityId): Promise<Role> => {
                            return Promise.resolve(roleFactory.buildWithId({}, roleId));
                        }),
                    },
                },
                {
                    provide: TeamsRepo,
                    useValue: {
                        findById: jest.fn().mockImplementation((teamId: EntityId): Promise<Team> => {
                            return Promise.resolve(teamFactory.buildWithId({}, teamId));
                        }),
                    }
                },
                {
                    provide: TeamStorageAdapter,
                    useValue: createMock<TeamStorageAdapter>(),
                },
            ]
        }).compile()]);
        service = module.get(TeamStorageService);
        roleRepo = module.get(RoleRepo);
        teamsRepo = module.get(TeamsRepo);
        adapter = module.get(TeamStorageAdapter);
        roleMapper = module.get(RoleMapper);
        teamMapper = module.get(TeamMapper);
        mockId = "0123456789abcdef01234567"
    });

    describe('Find Team By Id', () => {
        it('should find a team with a provided id', async () => {
            const ret = await service.findTeamById(mockId);
            expect(ret.id).toEqual(mockId);
        });
    });

    describe('Find Role By Id', () => {
        it('should find a role with a provided id', async () =>{
            const ret = await service.findRoleById(mockId);
            expect(ret.id).toEqual(mockId);
        });
    });

    describe('Is User Authorized', () => {
        beforeAll(() => {
            jest.spyOn(service, 'findTeamById').mockResolvedValue(
                {name: "testTeam", userIds: [{userId: "testUser", schoolId: "testSchool", role: "testRoleId"}]}
            );
        });
        it('should authorize the user as owner', async () => {
            jest.spyOn(service, 'findRoleById').mockResolvedValue(
                {id:"testRoleId", name: RoleName.TEAMOWNER});
            const ret = await service.isUserAuthorized("testUser", "testTeam");
            expect(ret).toBeTruthy();
        });
        it('should authorize the user as admin', async () => {
            jest.spyOn(service, 'findRoleById').mockResolvedValue(
                {id:"testRoleId", name: RoleName.TEAMADMINISTRATOR});
            const ret = await service.isUserAuthorized("testUser", "testTeam");
            expect(ret).toBeTruthy();
        });
        it('should not authorize the user', async () => {
            jest.spyOn(service, 'findRoleById').mockResolvedValue(
                {id:"testRoleId", name: RoleName.TEAMMEMBER});
            const ret = await service.isUserAuthorized("testUser", "testTeam");
            expect(ret).toBeFalsy();
        });
    });

    describe('Update TeamPermissions For Role', () => {
       it('should call the adapter', async () => {
           jest.spyOn(service, 'isUserAuthorized').mockImplementation(() => {
               return Promise.resolve(true);
           });
           jest.spyOn(service, 'findRoleById').mockResolvedValue(
               {id:"testRoleId", name: RoleName.TEAMMEMBER});
           jest.spyOn(service, 'findTeamById').mockResolvedValue(
               {name: "testTeam", userIds: [{userId: "testUser", schoolId: "testSchool", role: "testRoleId"}]}
           );
           jest.spyOn(adapter, 'updateTeamPermissionsForRole').mockImplementation(() => {
               return; // do nothing
           })
           await service.updateTeamPermissionsForRole(
               mockId,
               mockId,
               mockId,
               {read: false, write: false, create: false, delete: false, share: false})
            expect(adapter.updateTeamPermissionsForRole).toHaveBeenCalled();
       });

        it('should throw a forbidden exception', async () => {
            jest.spyOn(service, 'isUserAuthorized').mockImplementation(() => {
                return Promise.resolve(false);
            });
            await expect(
                 service.updateTeamPermissionsForRole(
                    mockId,
                    mockId,
                    mockId,
                    {read: false, write: false, create: false, delete: false, share: false})
            ).rejects.toThrow(ForbiddenException);
        });

    });
})
