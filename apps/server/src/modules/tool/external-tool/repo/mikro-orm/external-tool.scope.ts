import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { ExternalToolMediumStatus } from '../../enum';
import { ExternalToolEntity } from './external-tool.entity';

export class ExternalToolScope extends Scope<ExternalToolEntity> {
	public byName(name?: string): this {
		if (name) {
			this.addQuery({ name: { $re: name } });
		}
		return this;
	}

	public byClientId(clientId?: string): this {
		if (clientId) {
			this.addQuery({ config: { clientId } });
		}
		return this;
	}

	public byHidden(isHidden?: boolean): this {
		if (isHidden !== undefined) {
			this.addQuery({ isHidden });
		}
		return this;
	}

	public byIds(ids?: EntityId[]): this {
		if (ids) {
			this.addQuery({ id: { $in: ids } });
		}
		return this;
	}

	public byPreferred(isPreferred?: boolean): this {
		if (isPreferred !== undefined) {
			this.addQuery({ isPreferred });
		}
		return this;
	}

	public byTemplateOrDraft(isTemplateOrDraft?: boolean): this {
		if (!isTemplateOrDraft) {
			this.addQuery({ $or: [{ medium: { status: ExternalToolMediumStatus.ACTIVE } }, { medium: { $exists: false } }] });
		}
		return this;
	}
}
