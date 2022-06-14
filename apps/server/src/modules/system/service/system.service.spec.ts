import {Test, TestingModule} from "@nestjs/testing";
import {MikroORM} from "@mikro-orm/core";
import {System} from "@shared/domain";
import {SystemRepo} from "@shared/repo";
import {setupEntities, systemFactory} from "@shared/testing";
import {SystemService} from "./system.service";

describe('SystemService', () => {
    let module: TestingModule;
    let systemService: SystemService;
    let orm: MikroORM;
    let mockSystems: System[];
    let systemRepo: SystemRepo;

    afterAll(async () => {
        await module.close();
        await orm.close();
    });

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                SystemService,
                {
                    provide: SystemRepo,
                    useValue: {
                        findOauthSystems: jest.fn().mockImplementation(() => Promise.resolve(mockSystems))
                    },
                }
            ],
        }).compile();
        systemRepo = module.get(SystemRepo);
        systemService = module.get(SystemService);
        orm = await setupEntities();
        mockSystems = [];
    });

    describe('findOauthSystems', () => {
        it('should return systemDtos', async () => {
            mockSystems.push(systemFactory.build());
            mockSystems.push(systemFactory.build({oauthConfig: undefined}));
            mockSystems.push(systemFactory.build());

            const resultSystems = await systemService.findOauthConfigs();

            expect(resultSystems.length).toEqual(2);
            expect(resultSystems[0]).toEqual(mockSystems[0].oauthConfig);
            expect(resultSystems[1]).toEqual(mockSystems[2].oauthConfig);
        });

        it('should return no systemDtos', async () => {
            mockSystems = [];
            const resultSystems = await systemService.findOauthConfigs();
            expect(resultSystems).toEqual([]);
        });
    });
});
