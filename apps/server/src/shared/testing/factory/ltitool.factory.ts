import { BaseFactory } from '@shared/testing/factory/base.factory';
import { ILtiToolProperties, LtiTool } from '@shared/domain/index';
import { DeepPartial } from 'fishery';

class LtiToolFactory extends BaseFactory<LtiTool, ILtiToolProperties> {
	withName(name: string): this {
		const params: DeepPartial<ILtiToolProperties> = {
			name,
		};
		return this.params(params);
	}

	withOauthClientId(oAuthClientId: string): this {
		const params: DeepPartial<ILtiToolProperties> = {
			oAuthClientId,
		};
		return this.params(params);
	}

	withLocal(isLocal: boolean): this {
		const params: DeepPartial<ILtiToolProperties> = {
			isLocal,
		};
		return this.params(params);
	}
}

export const ltiToolFactory = LtiToolFactory.define(LtiTool, ({ sequence }) => {
	return {
		name: `ltiTool-${sequence}`,
	};
});
