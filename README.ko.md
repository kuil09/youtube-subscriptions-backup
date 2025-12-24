# YouTube 구독 관리자 (정적 웹)

<p>
  <img src="public/logo-120.svg" width="120" height="120" alt="YouTube 구독 관리자 로고" />
</p>

다음 작업을 도와주는 **정적 웹 앱**입니다: **구독 중인 YouTube 채널 목록**을 백업하고(Export) 정리한 뒤, 파일을 다시 Import 해서 브라우저에서 구독을 추가/복구합니다.

읽을 언어: [English](README.md) | **한국어** | [日本語](README.ja.md)

## 핵심 기능
- 내가 구독 중인 채널 **갯수 표시**
- 구독 중인 YouTube 채널 목록을 파일로 **Export** (JSON/CSV)
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
  - 예: `http://localhost:5173`, `https://youtube.kuil09.dev`
  - ⚠️ **중요**: 앱이 호스팅되는 정확한 도메인을 추가하세요. 경로(예: `/index.html`)는 포함하지 마세요.
  - ⚠️ **리디렉션 URI는 추가하지 마세요** - Google Identity Services (GIS) Token Client는 JavaScript origins만 필요합니다.

3) **Client ID 설정**
- `VITE_GOOGLE_OAUTH_CLIENT_ID`를 빌드 시점 환경변수로 설정합니다.
- GitHub Pages 배포의 경우 GitHub Actions Secret에 `VITE_GOOGLE_OAUTH_CLIENT_ID`를 추가하면, 워크플로우가 `npm run build` 시 주입합니다.

## OAuth 오류 해결

### 오류 400: redirect_uri_mismatch

다음과 같은 오류가 표시되는 경우:
```
오류 400: redirect_uri_mismatch
앱이 Google의 OAuth 2.0 정책을 준수하지 않기 때문에 앱에 로그인할 수 없습니다.
redirect_uri=storagerelay://https/<your-domain>?id=auth...
```

**원인**: 앱의 도메인이 Google Cloud Console에 승인된 JavaScript origin으로 등록되지 않았을 때 발생합니다.

**해결 방법**:
1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials로 이동
2. OAuth 2.0 Client ID를 선택
3. **Authorized JavaScript origins** 섹션에서 **ADD URI** 클릭
4. 앱의 전체 origin을 추가 (예: `https://youtube.kuil09.dev`)
   - 로컬 개발: `http://localhost:5173` (또는 Vite가 사용하는 포트)
   - 프로덕션: 정확한 배포 URL (경로 제외)
5. **저장** 클릭
6. 변경사항이 적용될 때까지 몇 분 대기
7. 브라우저 캐시를 지우고 다시 로그인 시도

**참고**: Google Identity Services는 내부 리디렉션 URI 형식(`storagerelay://`)을 사용하며, 이는 설정할 수 없고 설정해서도 안 됩니다. **Authorized JavaScript origins**에 도메인만 추가하면 됩니다.

## OAuth 스코프
- 조회(읽기) 작업:
  - `https://www.googleapis.com/auth/youtube.readonly`
- 구독 변경(구독 취소/추가) 작업:
  - `https://www.googleapis.com/auth/youtube`

## OAuth 보안
이 앱은 OAuth 보안 모범 사례를 구현합니다:
- **State 파라미터**: 각 OAuth 요청마다 암호학적으로 안전한 랜덤 state 파라미터를 생성하여 CSRF 공격 및 세션 고정 공격을 방지합니다
- **State 검증**: OAuth 콜백 반환 시 state를 검증하여, 불일치하거나 누락된 state는 거부합니다
- **세션 저장소**: State 값은 `sessionStorage`(탭 범위)에 저장되며, 검증 후 한 번만 사용됩니다
- **안전한 난수 생성**: `crypto.getRandomValues()`를 사용하여 256비트 엔트로피로 예측 불가능한 state 값을 생성합니다

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

