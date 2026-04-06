# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Electron + Vite 개발 서버 실행
npm run build        # 전체 빌드
npm run build:win    # Windows 설치파일 패키징
npm run lint         # ESLint 검사
npm run format       # Prettier 포맷
```

## Architecture

**Electron + React + Vite** (`electron-vite` 템플릿 기반).

```
src/
├── main/index.js          # Electron 메인 프로세스 (창 생성, IPC)
├── preload/index.js       # contextBridge — window.electronAPI 노출
└── renderer/src/          # React 앱 루트 (이하 모든 UI 코드)
    ├── styles/global.css  # CSS 변수 토큰 (색상·타이포·반경) + Reset
    ├── main.jsx           # ReactDOM 진입점, global.css import
    ├── App.jsx            # RouterProvider 래퍼
    ├── router.jsx         # createHashRouter (file:// 대응), Root > AuthProvider > Outlet
    ├── stores/            # Zustand 전역 상태
    ├── hooks/             # useStompClient, useTokenRefresh, useMessageSearch
    ├── pages/             # LoginPage, OAuthCallbackPage
    └── components/
        ├── ui/            # 디자인 시스템 원자 컴포넌트
        ├── layout/        # MainLayout, AuthProvider
        ├── sidebar/       # ChannelSidebar 조합
        ├── chat/          # ChatArea 조합
        ├── input/         # InputArea 조합
        ├── panel/         # RightPanel, PinnedMessages, MemberList, UserProfileModal
        └── thread/        # ThreadDrawer
```

## Key Conventions

**스타일링**: CSS Modules (`*.module.css`) + CSS 변수. Tailwind 미사용. 모든 색상·간격은 `global.css`의 `--color-*`, `--radius-*` 변수를 참조한다.

**Path aliases** (`electron.vite.config.mjs`):
- `@` → `src/renderer/src/`
- `@ui` → `src/renderer/src/components/ui/`
- `@stores` → `src/renderer/src/stores/`
- `@hooks` → `src/renderer/src/hooks/`

**상태 관리**: Zustand. store 파일은 `stores/` 에 위치하며 컴포넌트에서 `useXxxStore((s) => s.field)` selector 패턴으로 사용한다.

**실시간 통신**: STOMP over SockJS (`useStompClient`). 메시지 전송은 REST 없이 STOMP `/app/channel/{channelId}/send` 전용. 수신 이벤트(`NotificationEvent`)는 `messageStore.appendFromStomp`로 병합한다.

**인증**: OAuth2 전용 (Google/GitHub). 액세스 토큰 수명 15분 → `useTokenRefresh`가 만료 1분 전 자동 갱신 후 STOMP 재연결 트리거.

## Mock / Backend Toggle

백엔드 미연결 상태에서는 HTTP 호출이 주석 처리되어 있고 목업 데이터가 활성화되어 있다.
백엔드 연동 시 각 파일의 `// TODO: 백엔드 연동 시 아래 주석 해제` 블록을 복구하고 아래도 함께 수정한다:

| 파일 | 작업 |
|------|------|
| `router.jsx` | `/` 경로를 `LoginPage`로 복구 |
| `AuthProvider.jsx` | 인증 체크·리디렉트 로직 복구 |
| `channelStore.js` | 목업 데이터 제거, API 호출 복구 |
| `messageStore.js` | 목업 데이터 제거, API 호출 복구 |
| `MyProfile.jsx` | 목업 유저 제거, API 호출 복구 |
| `useStompClient.js` | 연결 useEffect 복구 |

## Environment Variables

프로젝트 루트에 `.env` 파일 필요 (Vite는 `VITE_` 접두사만 렌더러에 노출):

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WORKSPACE_ID=1
```

## Backend Constraints

- 메시지 전송: STOMP 전용, `POST /messages` REST 없음
- 워크스페이스 목록 API 없음 → `VITE_WORKSPACE_ID` 고정값 사용
- STOMP 연결 헤더에 `Authorization: Bearer {token}` 필수
- 파일 업로드: `POST /api/v1/files/upload` → fileId → STOMP content에 포함
- OAuth2 콜백: `OAUTH2_REDIRECT_URI?accessToken=...&refreshToken=...` 쿼리파라미터
- 에러 응답 포맷: `{ success: false, error: { code, message } }`
