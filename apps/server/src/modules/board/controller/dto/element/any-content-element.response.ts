import { FileElementResponse } from './file-element.response';
import { RichTextElementResponse } from './richtext-element.response';

export type AnyContentElementResponse = RichTextElementResponse | FileElementResponse;
