import { Scope } from '@shared/repo';
import { ExternalTool } from '@shared/domain';

export class ExternalToolScope extends Scope<ExternalTool> {
	byName(name: string | undefined): ExternalToolScope {
		if (name) {
			this.addQuery({ name: { $re: name } });
		}
		return this;
	}

	byHidden(isHidden: boolean | undefined): ExternalToolScope {
		if (isHidden !== undefined) {
			this.addQuery({ isHidden });
		}
		return this;
	}
}
