import { LtiTool } from '@shared/domain';
import { Scope } from '../scope';

export class LtiToolScope extends Scope<LtiTool> {
	byName(name: string | undefined): LtiToolScope {
		if (name) {
			this.addQuery({ name: { $re: name } });
		}
		return this;
	}

	byTemplate(isTemplate: boolean | undefined): LtiToolScope {
		if (isTemplate) {
			this.addQuery({ isTemplate });
		}
		return this;
	}

	byHidden(isHidden: boolean | undefined): LtiToolScope {
		if (isHidden) {
			this.addQuery({ isHidden });
		}
		return this;
	}
}
