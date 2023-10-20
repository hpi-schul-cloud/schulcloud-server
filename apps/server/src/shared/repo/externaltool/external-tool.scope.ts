import { ExternalTool } from '@shared/domain';
import { Scope } from '@shared/repo';

export class ExternalToolScope extends Scope<ExternalTool> {
	byName(name: string | undefined): ExternalToolScope {
		if (name) {
			this.addQuery({ name: { $re: name } });
		}
		return this;
	}

	byClientId(clientId: string | undefined): ExternalToolScope {
		if (clientId) {
			this.addQuery({ config: { clientId } });
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
