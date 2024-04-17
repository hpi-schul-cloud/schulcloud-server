import { NotImplementedException } from '@nestjs/common';

import { InputFormat } from '@shared/domain/types';
import { plainToClass } from 'class-transformer';
import { SanitizeHtml } from './sanitize-html.transformer';

describe('SanitizeHtmlTransformer Decorator', () => {
	class WithHtmlDto {
		@SanitizeHtml()
		title!: string;

		@SanitizeHtml(InputFormat.PLAIN_TEXT)
		title2!: string;

		@SanitizeHtml(InputFormat.PLAIN_TEXT)
		excerpt?: string;

		@SanitizeHtml(InputFormat.RICH_TEXT_CK5)
		contentCk5!: string;

		@SanitizeHtml(InputFormat.RICH_TEXT_CK4)
		contentCk4!: string;

		@SanitizeHtml(InputFormat.RICH_TEXT_CK5_SIMPLE)
		contentRichTextCk5Simple!: string;
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

	describe('when sanitizing rich text ck5 formatting', () => {
		it('should remove all html but rich text ck5 tags', () => {
			const plainString = {
				contentCk5:
					'<h1></h1><h2><b><mark>html <h4>text</h4></mark></b></h2><span class="math-tex">[x=\frac{-bpmsqrt{b^2-4ac}}{2a}]</span><scriPT>alert("foobar");</sCript><stYle></style><img src="some.png" />',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentCk5).toEqual(
				'<b><mark>html <h4>text</h4></mark></b><span class="math-tex">[x=\frac{-bpmsqrt{b^2-4ac}}{2a}]</span>'
			);
		});
		it('should remove attributes without values', () => {
			const plainString = {
				contentCk5: '<a name></a><a link></a>',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentCk5).toEqual('<a></a><a></a>');
		});
	});

	describe('when sanitizing rich text ck4 formatting', () => {
		it('should remove all html and js except Rich Text CK4 tags', () => {
			const plainString = {
				contentCk4:
					'<h1><b>html text</b></h1><a name="some name">name</a><a href="some-link"></a><scriPT>alert("foobar");</sCript><stYle></style>',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentCk4).toEqual(
				'<h1><b>html text</b></h1><a name="some name">name</a><a href="some-link"></a>'
			);
		});
	});

	describe('when sanitizing rich text Ck5 simple formatting', () => {
		it('should remove all html but rich text ck5 simple tags', () => {
			const plainString = {
				contentRichTextCk5Simple:
					'<h1></h1><h2><b><mark>html <h4>text</h4></mark></b></h2><span class="math-tex">[x=\frac{-bpmsqrt{b^2-4ac}}{2a}]</span><scriPT>alert("foobar");</sCript><stYle></style><img src="some.png" />',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentRichTextCk5Simple).toEqual(
				'<h2>html <h4>text</h4></h2>[x=rac{-bpmsqrt{b^2-4ac}}{2a}]<img src="some.png" />'
			);
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
