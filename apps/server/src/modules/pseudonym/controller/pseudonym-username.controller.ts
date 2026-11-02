import { type ICurrentUser } from '@infra/auth-guard';
import { Controller, Get, Param, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtExtractor } from '@shared/common/utils';
import { randomBytes } from 'node:crypto';
import { parse as parseCookie } from 'cookie';
import { type Request, type Response } from 'express';
import { PseudonymUc } from '../uc';
import { PseudonymParams } from './dto/pseudonym-params';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

const escapeHtml = (value: string): string =>
	value.replace(/[&<>"']/g, (character) => {
		const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
		return entities[character];
	});

const labels: Record<string, { showName: string; explanation: string; loginExplanation: string }> = {
	de: {
		showName: 'Namen zeigen',
		explanation:
			'Der Anbieter dieses Bildungsinhaltes kennt Ihren echten Namen nicht. Er wird direkt aus der Schulcloud angezeigt.',
		loginExplanation:
			'Bitte melden Sie sich in der Schulcloud an, um Namen anzuzeigen. Die Anmeldung öffnet sich in einem neuen Tab. Laden Sie diese Seite danach neu.',
	},
	en: {
		showName: 'Show name',
		explanation:
			'The provider of this educational content does not know your real name. It is displayed directly by Schulcloud.',
		loginExplanation: 'Sign in to Schulcloud to show names. Sign-in opens in a new tab. Reload this page afterwards.',
	},
	es: {
		showName: 'Mostrar nombre',
		explanation:
			'El proveedor de este contenido educativo no conoce tu nombre real. Se muestra directamente desde Schulcloud.',
		loginExplanation:
			'Inicia sesión en Schulcloud para mostrar los nombres. Se abrirá una nueva pestaña. Después, vuelve a cargar esta página.',
	},
	uk: {
		showName: "Показати ім'я",
		explanation: 'Постачальник цього навчального контенту не знає вашого справжнього імені. Його показує Schulcloud.',
		loginExplanation:
			'Увійдіть до Schulcloud, щоб побачити імена. Сторінка входу відкриється в новій вкладці. Після цього оновіть цю сторінку.',
	},
};

@Controller('pseudonyms/username')
export class PseudonymUsernameController {
	constructor(private readonly pseudonymUc: PseudonymUc) {}

	@Get(':pseudonym')
	@UseGuards(OptionalJwtAuthGuard)
	public async showName(
		@Param() params: PseudonymParams,
		@Req() request: Request,
		@Res() response: Response
	): Promise<void> {
		const hasJwt = Boolean(JwtExtractor.extractJwtFromRequest(request));
		const requestedLanguage = parseCookie(request.headers.cookie || '').USER_LANG;
		const language = requestedLanguage && Object.hasOwn(labels, requestedLanguage) ? requestedLanguage : 'de';
		const localized = labels[language];
		let name = localized.showName;
		if (hasJwt) {
			const currentUser = request.user as ICurrentUser | undefined;
			if (!currentUser) {
				throw new UnauthorizedException();
			}
			name = await this.pseudonymUc.resolveNameForUser(currentUser.userId, params.pseudonym);
		}

		const nonce = randomBytes(16).toString('base64');
		const script = hasJwt
			? ''
			: `<script nonce="${nonce}">
const nameButton = document.querySelector('.depseudo button');
const loginLink = document.querySelector('.depseudo a');
const showLoginLink = () => {
  const wasFocused = document.activeElement === nameButton;
  nameButton.hidden = true;
  loginLink.hidden = false;
  if (wasFocused) loginLink.focus();
};

nameButton.addEventListener('click', () => {
  document.requestStorageAccess().then(() => window.location.reload()).catch(showLoginLink);
});

if (document.hasStorageAccess && document.requestStorageAccess) {
  document.hasStorageAccess().then((hasAccess) => {
    if (!hasAccess) {
      loginLink.hidden = true;
      nameButton.hidden = false;
    }
  }).catch(() => {});
}
</script>`;

		response.setHeader('Cache-Control', 'no-store');
		response.setHeader('X-Content-Type-Options', 'nosniff');
		response.setHeader(
			'Content-Security-Policy',
			`default-src 'self'; script-src 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; frame-ancestors *`
		);
		const content = hasJwt
			? `<div class="depseudo"><div class="cloud-logo"></div><a style="color: inherit; text-decoration: none" title="${escapeHtml(localized.explanation)}">${escapeHtml(name)}</a></div>`
			: `<div class="depseudo"><div class="cloud-logo"></div><button type="button" hidden style="background: none; border: 0; color: inherit; cursor: pointer; font: inherit; padding: 0" title="${escapeHtml(localized.explanation)}">${escapeHtml(name)}</button><a href="/login/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none" title="${escapeHtml(localized.loginExplanation)}" aria-label="${escapeHtml(localized.loginExplanation)}">${escapeHtml(name)}</a></div>`;

		response.type('html').send(`<!doctype html>
<html lang="${language}"><head><meta charset="utf-8">
<link rel="stylesheet" href="/styles/fonts/ptsans.css">
<link rel="stylesheet" href="/styles/oauth2/username.css">
</head><body>${content}${script}</body></html>`);
	}
}
