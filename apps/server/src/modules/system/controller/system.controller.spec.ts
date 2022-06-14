import {Test, TestingModule} from "@nestjs/testing";
import {SystemController} from "@src/modules/system/controller/system.controller";
import {SystemUc} from "@src/modules/system/uc/system.uc";

describe('system.controller', () => {
    let module: TestingModule;
    let controller: SystemController;
    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                SystemController,
                {
                    provide: SystemUc,
                    useValue: {},
                },
            ],
        }).compile();
        controller = module.get(SystemController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});