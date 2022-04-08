import { NotImplementedException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { SanitizeHtml } from './sanitize-html.transformer';

describe('SanitizeHtmlTransformer Decorator', () => {
	class WithHtmlDto {
		@SanitizeHtml()
		title!: string;

		@SanitizeHtml({ keep: 'inline' })
		excerpt?: string;

		@SanitizeHtml({ keep: 'richtext' })
		content!: string;
	}

	describe('when fully sanitizing an input string', () => {
		it('should remove all html', () => {
			const plainString = { title: '<b>html text</b>' };
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.title).toEqual('html text');
		});
	});

	describe('when sanitizing inline formatting', () => {
		it('should remove all html but inline tags', () => {
			const plainString = { excerpt: '<h1><b>html text</b></h1>' };
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.excerpt).toEqual('<b>html text</b>');
		});
	});

	describe('when sanitizing richtext formatting', () => {
		it('should remove all html but richtext tags', () => {
			const plainString = { content: '<h1><b>html text</b></h1><scriPT>alert("foobar");</sCript><stYle></style>' };
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.content).toEqual('<h1><b>html text</b></h1>');
		});
	});

	it('should allow optional properties', () => {
		const instance = plainToClass(WithHtmlDto, { title: 'title', content: 'content' });
		expect(instance.excerpt).toBe(undefined);
	});

	it('should throw when the property is not a string', () => {
		expect(() => plainToClass(WithHtmlDto, { title: 42 })).toThrow(NotImplementedException);
	});
});
