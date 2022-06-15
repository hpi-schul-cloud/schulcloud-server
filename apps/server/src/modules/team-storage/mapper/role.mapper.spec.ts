import {Test, TestingModule} from "@nestjs/testing";
import {RoleMapper} from "@src/modules/team-storage/mapper/role.mapper";
import {Role, RoleName} from "@shared/domain";
import {roleFactory} from "@shared/testing";

describe('RoleMapper', () => {
    let module: TestingModule;
    let mapper: RoleMapper;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [],
            providers: [
                RoleMapper,
            ],
        }).compile();
        mapper = module.get(RoleMapper);
    });

    describe('Map Role', () => {

        it('should map entity to dto', () => {
            const roleEntity = roleFactory.build();
            const ret = mapper.mapEntityToDto(roleEntity);
            expect(ret.name).toEqual(roleEntity.name);
        })
    })
});