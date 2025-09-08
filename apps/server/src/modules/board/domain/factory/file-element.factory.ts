import { FileElement } from '../file-element.do';
import { FileElementProps } from '../types';

export class FileElementFactory {
	public static build(props: FileElementProps): FileElement {
		return new FileElement(props);
	}
}
