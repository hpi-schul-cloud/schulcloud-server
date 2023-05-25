import { FileElementResponse } from './file-element.response';
import { RichTextElementResponse } from './rich-text-element.response';

export type AnyContentElementResponse = RichTextElementResponse | FileElementResponse;
