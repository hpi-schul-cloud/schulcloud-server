import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { Scope } from '@shared/repo/scope';
import { EntityId } from '../../domain/types';

export class ExternalToolScope extends Scope<ExternalToolEntity> {
	byName(name?: string): this {
		if (name) {
			this.addQuery({ name: { $re: name } });
		}
		return this;
	}

	byClientId(clientId?: string): this {
		if (clientId) {
			this.addQuery({ config: { clientId } });
		}
		return this;
	}

	byHidden(isHidden?: boolean): this {
		if (isHidden !== undefined) {
			this.addQuery({ isHidden });
		}
		return this;
	}

	byIds(ids?: EntityId[]): this {
		if (ids) {
			this.addQuery({ id: { $in: ids } });
		}
		return this;
	}
}
