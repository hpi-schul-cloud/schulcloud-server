import { CustomParameterEntry } from '../../common/domain';
import { ContextExternalToolLaunchable, ContextRef } from '../../context-external-tool/domain';
import { SchoolExternalToolRefDO } from '../../school-external-tool/domain';

export class PseudoContextExternalTool implements ContextExternalToolLaunchable {
	contextRef: ContextRef;

	schoolToolRef: SchoolExternalToolRefDO;

	parameters: CustomParameterEntry[];

	constructor(props: ContextExternalToolLaunchable) {
		this.contextRef = props.contextRef;
		this.schoolToolRef = props.schoolToolRef;
		this.parameters = props.parameters;
	}
}
