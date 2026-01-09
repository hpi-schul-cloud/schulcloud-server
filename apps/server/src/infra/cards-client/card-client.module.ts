import { Module } from '@nestjs/common';
import { CardClientAdapter } from '.';

@Module({
	providers: [CardClientAdapter],
	exports: [CardClientAdapter],
})
export class CardClientModule {}
