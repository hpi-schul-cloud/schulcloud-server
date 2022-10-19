import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';
import {ExternalTool, IExternalToolProperties} from "@shared/domain/entity/external-tool.entity";
import {System} from "@shared/domain";
import {SystemProvisioningStrategy} from "@shared/domain/interface/system-provisioning.strategy";
import {SystemFactory} from "@shared/testing";

export class ExternalToolFactory extends BaseFactory<ExternalTool, IExternalToolProperties> {
    withExternalToolConfig(): this {
        const params: DeepPartial<IExternalToolProperties> = {
            ExternalToolConfig {
                type: 'basic',
                baseUrl: 'baseUrlMock',
            },
        };
        return this.params(params)
    }
}

export const externalToolFactory = ExternalToolFactory.define(ExternalTool, ({ sequence }) => {
    return {
        name:
        url:
        logoUrl:
        config:
        parameters:
        isHidden: false
        openNewTab: true
        version:
    };
});
