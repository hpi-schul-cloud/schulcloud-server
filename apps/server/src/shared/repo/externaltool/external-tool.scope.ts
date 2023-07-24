import { ExternalTool } from '@shared/domain/entity/tools/external-tool/external-tool.entity';
import { Scope } from '@shared/repo/scope';

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
