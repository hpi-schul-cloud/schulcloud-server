import {Test, TestingModule} from "@nestjs/testing";
import {TeamStorageAdapter} from "@shared/infra/team-storage/team-storage.adapter";
import {ITeamStorageStrategy} from "@shared/infra/team-storage/strategy/base.interface.strategy";
import {TeamRolePermissionsDto} from "@shared/infra/team-storage/dto/team-role-permissions.dto";
import {TeamStorageAdapterMapper} from "@shared/infra/team-storage/mapper/team-storage-adapter.mapper";

class TestStrategy implements ITeamStorageStrategy{
    baseURL: string;

    constructor(){
        this.baseURL= "mocked";
    }

    updateTeamPermissionsForRole(dto: TeamRolePermissionsDto): void {
        return;
    }

}

describe('TeamStorage Adapter',() => {
    let module: TestingModule;
    let adapter: TeamStorageAdapter;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers:[
                TeamStorageAdapter,
                TeamStorageAdapterMapper,
                {
                    provide: 'ITeamStorageStrategy',
                    useValue: TestStrategy
                }
            ]
        }).compile();
        adapter = module.get(TeamStorageAdapter);
    });

    describe('Set Strategy',() => {
       it('should set a new strategy',() => {
           const testStrat = new TestStrategy();
           adapter.setStrategy(testStrat);
           expect(adapter.strategy).toEqual(testStrat);
        });
    });

    describe('Update Team Permissions For Role',() => {
        it('should call the strategy',() => {
            adapter.updateTeamPermissionsForRole(
                {id: 'teamId', name: 'teamName', userIds: [{userId: 'testUser', role:'testRole',schoolId: 'testschool'}]},
                {id: 'testRole', name: 'testRoleName'},
                {
                    read: false,
                    write: false,
                    create: false,
                    delete: false,
                    share: false
                }
            );
        });
    })
})
