import { LtiTool } from '@shared/domain';
import { Scope } from '../scope';

// TODO: tests
export class LtiToolScope extends Scope<LtiTool> {
	byName(name: string | undefined): LtiToolScope {
		if (name) {
			this.addQuery({ name: { $re: name } });
		}
		return this;
	}

	byTemplate(isTemplate: boolean | undefined): LtiToolScope {
		if (isTemplate !== undefined) {
			this.addQuery({ isTemplate });
		}
		return this;
	}

	byHidden(isHidden: boolean | undefined): LtiToolScope {
		if (isHidden !== undefined) {
			this.addQuery({ isHidden });
		}
		return this;
	}
}
