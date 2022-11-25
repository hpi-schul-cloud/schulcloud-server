import { NotImplementedException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { InputFormat } from '@shared/domain';
import { SanitizeHtml } from './sanitize-html.transformer';

describe('SanitizeHtmlTransformer Decorator', () => {
	class WithHtmlDto {
		@SanitizeHtml()
		title!: string;

		@SanitizeHtml(InputFormat.PLAIN_TEXT)
		title2!: string;

		@SanitizeHtml(InputFormat.RICHTEXT_SIMPLE)
		excerpt?: string;

		@SanitizeHtml(InputFormat.RICH_TEXT)
		content!: string;

		@SanitizeHtml(InputFormat.RICH_TEXT_CK5)
		contentCk5!: string;

		@SanitizeHtml(InputFormat.RICH_TEXT_CK5_SIMPLE)
		contentCk5Simple!: string;

		@SanitizeHtml(InputFormat.RICH_TEXT_CK4)
		contentCk4!: string;
	}

	describe('when fully sanitizing an input string', () => {
		it('should remove all html', () => {
			const plainString = { title: '<b>html text</b>' };
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.title).toEqual('html text');

			const plainString2 = { title2: '<b>html text</b>' };
			const instance2 = plainToClass(WithHtmlDto, plainString2);
			expect(instance2.title2).toEqual('html text');
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

	describe('when sanitizing richtext ck5 formatting', () => {
		it('should remove all html but richtext ck5 tags', () => {
			const plainString = { contentCk5: '<h1><b>html text</b></h1><scriPT>alert("foobar");</sCript><stYle></style>' };
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentCk5).toEqual('<h1><b>html text</b></h1>');
		});
	});

	describe('when sanitizing richtext ck5 inline formatting', () => {
		it('should remove all html but richtext ck5 inline tags', () => {
			const plainString = { contentCk5Simple: '<b>html text</b>' };
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentCk5Simple).toEqual('<b>html text</b>');
		});
	});

	describe('when sanitizing richtext ck4 formatting', () => {
		it('should remove all html but richtext ck4 tags', () => {
			const plainString = { contentCk4: '<h1><b>html text</b></h1><scriPT>alert("foobar");</sCript><stYle></style>' };
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentCk4).toEqual('<h1><b>html text</b></h1>');
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
