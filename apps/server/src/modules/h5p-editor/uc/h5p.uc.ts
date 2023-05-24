import { Injectable } from '@nestjs/common';
import { H5PEditorService } from '../service/h5p-editor.service';
import { H5PPlayerService } from '../service/h5p-player.service';

@Injectable()
export class H5PEditorUc {
	constructor(private h5pEditorService: H5PEditorService, private h5pPlayerService: H5PPlayerService) {}
}
