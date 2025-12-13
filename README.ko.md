# YouTube 구독 관리자 (정적 웹)

<p>
  <img src="public/logo-120.svg" width="120" height="120" alt="YouTube 구독 관리자 로고" />
</p>

다음 작업을 도와주는 **정적 웹 앱**입니다: YouTube 구독 목록을 백업하고(Export) 정리한 뒤, 파일을 다시 Import 해서 브라우저에서 구독을 추가/복구합니다.

읽을 언어: [English](README.md) | **한국어** | [日本語](README.ja.md)

## 핵심 기능
- 내가 구독 중인 채널 **갯수 표시**
- 구독 목록을 파일로 **Export** (JSON/CSV)
- **Cleanup**: Export 후, typed confirm(직접 입력 확인)까지 거쳐 전체 구독 취소
- 수정한 Export 파일을 **Import**해서, 현재 구독에 없는 채널만 브라우저에서 구독 추가

UI는 **한국어/영어/일본어**를 지원하며, 브라우저 언어를 기본으로 자동 선택합니다(상단에서 변경 가능).

## 기술 스택
- Vite + TypeScript
- Google OAuth: **Google Identity Services (GIS) Token Client**
- YouTube Data API v3

## 개인정보처리방침/서비스 약관 (Google OAuth 심사용 필수)
- 개인정보처리방침: `privacy.html`
- 서비스 약관: `terms.html`

배포 후(예: GitHub Pages 프로젝트 페이지) 보통 아래 URL 형태로 접근됩니다:
- `https://<도메인>/<경로>/privacy.html`
- `https://<도메인>/<경로>/terms.html`

## 로컬 개발

```bash
npm install
npm run dev
```

이 웹 앱은 빌드 시점 환경변수를 필요로 합니다:

- `VITE_GOOGLE_OAUTH_CLIENT_ID`

로컬 개발에서는 실행 전에 다음처럼 설정하세요:

```bash
export VITE_GOOGLE_OAUTH_CLIENT_ID="xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
npm run dev
```

Vite가 출력하는 URL로 접속하세요.

빌드:

```bash
npm run build
```

프로덕션 빌드 미리보기:

```bash
npm run preview
```

## Google Cloud 설정(필수)

이 앱은 본인 Google Cloud 프로젝트와 OAuth Client ID가 필요합니다.

1) **API 활성화**
- Google Cloud Console에서 **YouTube Data API v3**를 활성화합니다.

2) **OAuth Client ID 생성**
- OAuth 클라이언트 유형을 **Web application**으로 생성합니다.
- 배포/로컬 도메인을 **Authorized JavaScript origins**에 추가합니다.
  - 예: `http://localhost:5173`, 배포 도메인

3) **Client ID 설정**
- `VITE_GOOGLE_OAUTH_CLIENT_ID`를 빌드 시점 환경변수로 설정합니다.
- GitHub Pages 배포의 경우 GitHub Actions Secret에 `VITE_GOOGLE_OAUTH_CLIENT_ID`를 추가하면, 워크플로우가 `npm run build` 시 주입합니다.

## OAuth 스코프
- 조회(읽기) 작업:
  - `https://www.googleapis.com/auth/youtube.readonly`
- 구독 변경(구독 취소/추가) 작업:
  - `https://www.googleapis.com/auth/youtube`

## Import 포맷

### JSON (권장)
JSON Export에는 항목별 `channelId`가 포함됩니다. Import는 `channelId`(또는 `/channel/<id>`를 포함한 URL)를 기대합니다.

### CSV
CSV는 최소한 `channelId` 컬럼이 있어야 합니다.

## 주의 / 안전장치
- **구독 취소/추가 동작은 실제 계정에 즉시 반영됩니다.** 반드시 먼저 Export로 백업한 후 진행하세요.
- 구독 수가 많으면 quota/rate limit에 걸릴 수 있습니다. 앱이 backoff/pacing을 적용하지만 실패가 발생할 수 있으며, 실패 리포트(JSON)를 다운로드합니다.

## 후원
이 앱이 도움이 되었다면 프로젝트를 후원해 주세요:
- `https://buymeacoffee.com/e3pbwto`

## 프로젝트 구조
- `index.html` — 메인 페이지
- `src/web/` — 웹 앱(OAuth, i18n, UI 로직)
- `src/shared/` — 공용 유틸/타입

