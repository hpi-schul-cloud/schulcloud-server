import { NotImplementedException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { InputFormat } from '../../domain/types';
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

		@SanitizeHtml(InputFormat.RICH_TEXT_CK5_TASK)
		contentCk5Task!: string;

		@SanitizeHtml(InputFormat.RICH_TEXT_CK4)
		contentCk4!: string;

		@SanitizeHtml(InputFormat.RICH_TEXT_CK5_SIMPLE)
		contentRichTextCk5Simple!: string;

		@SanitizeHtml(InputFormat.RICH_TEXT_CK5_NEWS)
		contentRichTextCk5News!: string;
	}

	describe('when sanitizing plain text', () => {
		it('should remove all html', () => {
			const plainString = { title: '<b>html text</b>' };
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.title).toEqual('html text');

			const plainString2 = { title2: '<b>html text</b>' };
			const instance2 = plainToClass(WithHtmlDto, plainString2);
			expect(instance2.title2).toEqual('html text');
		});

		it('should not encode html entities', () => {
			const plainString = { title: 'X & Y < 5' };
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.title).toEqual('X & Y < 5');

			const plainString2 = { title: 'X & Y > 5' };
			const instance2 = plainToClass(WithHtmlDto, plainString2);
			expect(instance2.title).toEqual('X & Y > 5');
		});

		describe('when the text contains a "<" without the closing ">"', () => {
			it('should remove all characters after the "<"', () => {
				const plainString = { title: 'X<Y & A' };
				const instance = plainToClass(WithHtmlDto, plainString);
				expect(instance.title).toEqual('X');
			});
		});

		describe('when the text contains both a "<" and ">"', () => {
			it('should remove all characters between "<" and ">"', () => {
				const plainString = { title: 'X<Y & A>B' };
				const instance = plainToClass(WithHtmlDto, plainString);
				expect(instance.title).toEqual('XB');
			});
		});
	});

	describe('when sanitizing rich text ck5 formatting', () => {
		it('should remove all html but rich text ck5 tags', () => {
			const plainString = {
				contentCk5:
					'<h1></h1><h2><b><mark>html <h4>text</h4></mark></b></h2><span class="math-tex">[x=\\frac{-bpmsqrt{b^2-4ac}}{2a}]</span><scriPT>alert("foobar");</sCript><stYle></style>',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentCk5).toEqual(
				'<b><mark>html <h4>text</h4></mark></b><span class="math-tex">[x=\\frac{-bpmsqrt{b^2-4ac}}{2a}]</span>'
			);
		});
		it('should preserve safe images and remove unsafe image attributes', () => {
			const plainString = {
				contentCk5:
					'<figure class="image"><img src="/file/download/id/image.png" alt="A picture" onerror="alert(1)" /></figure>',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentCk5).toEqual('<figure class="image"></figure>');
		});
		it('should remove attributes without values', () => {
			const plainString = {
				contentCk5: '<a name></a><a link></a>',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentCk5).toEqual('<a></a><a></a>');
		});
		it('should preserve images for task rich text only', () => {
			const plainString = {
				contentCk5: '<img src="task-image.png" alt="task image" />',
				contentCk5Task:
					'<figure class="image"><img src="task-image.png" alt="task image" onerror="alert(1)" /></figure>',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentCk5).toEqual('');
			expect(instance.contentCk5Task).toEqual(
				'<figure class="image"><img src="task-image.png" alt="task image" /></figure>'
			);
		});
		it('should preserve safe decimal image resize styles for task rich text only', () => {
			const plainString = {
				contentCk5:
					'<figure class="image image_resized" style="width:37.43%;height:120px;position:absolute"><img src="task-image.png" /></figure>',
				contentCk5Task:
					'<figure class="image image_resized" style="width:37.43%;height:120px;position:absolute"><img src="task-image.png" /></figure>',
			};
			const instance = plainToClass(WithHtmlDto, plainString);

			expect(instance.contentCk5).toEqual('<figure class="image image_resized"></figure>');
			expect(instance.contentCk5Task).toEqual(
				'<figure class="image image_resized" style="width:37.43%;height:120px"><img src="task-image.png" /></figure>'
			);
		});
		it('should preserve audio only for task rich text', () => {
			const plainString = {
				contentCk5: '<audio src="task-audio.mp3" controls></audio>',
				contentCk5Task: '<audio src="task-audio.mp3" controls controlslist="nodownload" onerror="alert(1)"></audio>',
			};
			const instance = plainToClass(WithHtmlDto, plainString);

			expect(instance.contentCk5).toEqual('');
			expect(instance.contentCk5Task).toEqual(
				'<audio src="task-audio.mp3" controls controlslist="nodownload"></audio>'
			);
		});
	});

	it('should preserve video only for task rich text', () => {
		const plainString = {
			contentCk5: '<video src="task-video.mp4" controls></video>',
			contentCk5Task: '<video src="task-video.mp4" controls controlslist="nodownload" onerror="alert(1)"></video>',
		};
		const instance = plainToClass(WithHtmlDto, plainString);

		expect(instance.contentCk5).toEqual('');
		expect(instance.contentCk5Task).toEqual('<video src="task-video.mp4" controls controlslist="nodownload"></video>');
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
					'<h1></h1><h2><b><mark>html <h4>text</h4></mark></b></h2><span class="math-tex">[x=\\frac{-bpmsqrt{b^2-4ac}}{2a}]</span><scriPT>alert("foobar");</sCript><stYle></style><img src="some.png" />',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentRichTextCk5Simple).toEqual(
				'<h2>html <h4>text</h4></h2>[x=\\frac{-bpmsqrt{b^2-4ac}}{2a}]<img src="some.png" />'
			);
		});
	});

	describe('when sanitizing rich text Ck5 news formatting', () => {
		it('should remove all html but rich text ck5 news tags', () => {
			const plainString = {
				contentRichTextCk5News:
					'<h1></h1><h2><b><mark>html <h4>text</h4><a target="link">hello world</a></mark></b></h2><span class="math-tex">[x=\\frac{-bpmsqrt{b^2-4ac}}{2a}]</span><scriPT>alert("foobar");</sCript><stYle></style><img src="some.png" />',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentRichTextCk5News).toEqual(
				'<h2>html <h4>text</h4><a target="link">hello world</a></h2>[x=\\frac{-bpmsqrt{b^2-4ac}}{2a}]<img src="some.png" />'
			);
		});

		it('should enforce rel="noopener noreferrer" on target="_blank" anchor tags', () => {
			const plainString = {
				contentRichTextCk5News: '<a href="https://example.com" target="_blank" rel="noopener">link</a>',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentRichTextCk5News).toEqual(
				'<a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a>'
			);
		});

		it('should add rel="noopener noreferrer" when target="_blank" has no rel attribute', () => {
			const plainString = {
				contentRichTextCk5News: '<a href="https://example.com" target="_blank">link</a>',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentRichTextCk5News).toEqual(
				'<a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a>'
			);
		});

		it('should not add rel when target is not "_blank"', () => {
			const plainString = {
				contentRichTextCk5News: '<a href="https://example.com" target="_self">link</a>',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentRichTextCk5News).toEqual('<a href="https://example.com" target="_self">link</a>');
		});

		it('should strip javascript: href from anchor tags', () => {
			const plainString = {
				contentRichTextCk5News: '<a href="javascript:alert(\'xss\')">click me</a>',
			};
			const instance = plainToClass(WithHtmlDto, plainString);
			expect(instance.contentRichTextCk5News).toEqual('<a>click me</a>');
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
