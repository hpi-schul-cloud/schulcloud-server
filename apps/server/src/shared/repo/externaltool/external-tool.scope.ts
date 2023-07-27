import { Scope } from '@shared/repo/scope';
import { ExternalTool } from '../../../modules/tool/external-tool/entity/external-tool.entity';

export class ExternalToolScope extends Scope<ExternalTool> {
	byName(name: string | undefined): this {
		if (name) {
			this.addQuery({ name: { $re: name } });
		}
		return this;
	}

	byClientId(clientId: string | undefined): this {
		if (clientId) {
			this.addQuery({ config: { clientId } });
		}
		return this;
	}

	byHidden(isHidden: boolean | undefined): this {
		if (isHidden !== undefined) {
			this.addQuery({ isHidden });
		}
		return this;
	}
}
