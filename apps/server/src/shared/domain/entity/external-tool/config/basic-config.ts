import { Embeddable } from '@mikro-orm/core';
import { ExternalToolConfig } from './external-tool-config';

@Embeddable()
export class BasicConfig extends ExternalToolConfig {}
