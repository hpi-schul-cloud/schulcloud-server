import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Module({
	providers: [PdfService],
	exports: [PdfService],
})
export class PdfGeneratorModule {}
