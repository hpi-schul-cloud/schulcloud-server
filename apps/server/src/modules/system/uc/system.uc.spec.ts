import {Test, TestingModule} from "@nestjs/testing";
import {SystemRepo} from "@shared/repo";
import {setupEntities, systemFactory} from "@shared/testing";
import {SystemUc} from "@src/modules/system/uc/system.uc";
import {SystemService} from "@src/modules/system/service/system.service";

describe('SystemUc', () => {
    let module: TestingModule;
    let systemUc: SystemUc;

    afterAll(async () => {
        await module.close();
    });

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                SystemUc,
                {
                    provide: SystemService,
                    useValue: {
                        findOauthConfigs: jest.fn().mockImplementation(() => Promise.resolve(mockSystems))
                    },
                }
            ],
        }).compile();
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
