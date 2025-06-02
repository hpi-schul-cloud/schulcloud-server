import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { ExternalToolEntity } from './external-tool.entity';

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

	byPreferred(isPreferred?: boolean): this {
		if (isPreferred !== undefined) {
			this.addQuery({ isPreferred });
		}
		return this;
	}

	byTemplateOrDraft(isTemplateOrDraft?: boolean): this {
		if (isTemplateOrDraft === undefined) {
			this.addQuery({ $or: [{ medium: { status: ExternalToolMediumStatus.ACTIVE } }, { medium: { $exists: false } }] });
		}
		return this;
	}
}
