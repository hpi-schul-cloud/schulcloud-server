import { FileElement } from '../file-element.do';
import { type FileElementProps } from '../types';

export class FileElementFactory {
	public static build(props: FileElementProps): FileElement {
		return new FileElement(props);
	}
}
