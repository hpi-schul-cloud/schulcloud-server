import { Embeddable } from '@mikro-orm/core';
import { ToolConfigType } from './tool-config-type.enum';
import { ExternalToolConfig } from './external-tool-config';

@Embeddable({ discriminatorValue: ToolConfigType.BASIC })
export class BasicToolConfig extends ExternalToolConfig {}
