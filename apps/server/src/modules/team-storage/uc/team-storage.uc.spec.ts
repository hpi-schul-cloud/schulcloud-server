import {Test, TestingModule} from "@nestjs/testing";
import {createMock} from "@golevelup/ts-jest";
import {TeamStorageUc} from "@src/modules/team-storage/uc/team-storage.uc";
import {TeamStorageService} from "@src/modules/team-storage/services/team-storage.service";
import {TeamPermissionsMapper} from "@src/modules/team-storage/mapper/team-permissions.mapper";
import {User} from "@shared/domain";
import {userFactory} from "@shared/testing";
import {TeamRoleDto} from "@src/modules/team-storage/controller/dto/team-role.params";
import {TeamPermissionsBody} from "@src/modules/team-storage/controller/dto/team-permissions.body.params";

describe('TeamStorageUc',() => {
    let module: TestingModule;
    let uc: TeamStorageUc;
    let service: TeamStorageService;
    let mapper: TeamPermissionsMapper;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [],
            providers: [
                TeamStorageUc,
                {
                    provide: TeamStorageService,
                    useValue: createMock<TeamStorageService>(),
                },
                {
                    provide: TeamPermissionsMapper,
                    useValue: createMock<TeamPermissionsMapper>()
                }
            ],
        }).compile();
        uc = module.get(TeamStorageUc);
        service = module.get(TeamStorageService);
        mapper = module.get(TeamPermissionsMapper);
    });

    describe('Update TeamRole Permissions', () => {
        let teamrole: TeamRoleDto;
        let permissions: TeamPermissionsBody;

        beforeAll(() => {
            teamrole = {team: "mockTeam", role: "MockRole"};
            permissions = {
                read: false,
                write: false,
                create: false,
                delete: false,
                share: false
            };
        });

        it('should call the service', async () => {
            await uc.updateUserPermissionsForRole("mockUser", teamrole, permissions);
        });
    });
});