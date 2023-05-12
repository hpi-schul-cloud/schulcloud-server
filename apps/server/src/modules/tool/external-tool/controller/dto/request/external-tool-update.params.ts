import { ExternalToolPostParams } from './external-tool-post.params';

export type ExternalToolUpdateParams = Partial<ExternalToolPostParams> & Pick<ExternalToolPostParams, 'config'>;
