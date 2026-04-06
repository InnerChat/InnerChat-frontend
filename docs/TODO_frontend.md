memo_memo — Frontend TODO List
> 기준: 개발물량 산정서 v0.1 (백엔드 호환성 검토 반영) | 전체: 57개

---

## 백엔드 연동 핵심 제약사항
> 구현 전 반드시 숙지

- **메시지 전송은 STOMP 전용** — `POST /messages` REST 엔드포인트 없음. `useStompClient.js`를 통해 `/app/channel/{channelId}/send`로만 전송
- **STOMP 브로드캐스트 페이로드 = `NotificationEvent`** — `MessageResponse`와 필드가 다름 (`username`, `displayName`, `isEdited`, `parentId` 없음). 수신 후 로컬 state에 merge하거나 필요 시 `GET /api/v1/channels/{id}/messages`로 동기화
- **OAuth2 전용 가입** — 로컬 회원가입 엔드포인트 없음. OAuth2(Google/GitHub) 로그인만 지원
- **OAuth2 콜백 처리 필요** — 로그인 성공 시 `OAUTH2_REDIRECT_URI?accessToken=...&refreshToken=...` 쿼리파라미터로 리디렉트됨
- **액세스 토큰 만료 15분** — 자동 갱신 로직 필수 (`POST /api/v1/auth/refresh`)
- **STOMP 연결 인증** — 연결 시 STOMP 헤더에 `Authorization: Bearer {token}` 포함 필수
- **파일 업로드 순서** — `POST /api/v1/files/upload`가 `messageId`를 요구하지만 메시지 생성은 STOMP 전용. 실용적 해결: 파일 먼저 업로드 → `fileId` 획득 → 메시지 content에 fileId 포함해 STOMP 전송
- **워크스페이스 API 미완성** — 목록/생성 API 없음. `workspaceId`는 환경변수 `VITE_WORKSPACE_ID`로 고정 운영
- **에러 응답 포맷** — 모든 오류: `{ success: false, error: { code, message } }`

---

## 1단계 — 스타일 기반 (1개)
- [ ] `global.css` — 폰트, CSS 변수(색상·간격·폰트 크기), reset 스타일

---

## 2단계 — 공통 UI 컴포넌트 ui/ (18개)
> 각 컴포넌트마다 `*.module.css` 파일을 함께 작성한다.

- [ ] `ui/Button.jsx` + `ui/Button.module.css`
- [ ] `ui/Input.jsx` + `ui/Input.module.css`
- [ ] `ui/Avatar.jsx` + `ui/Avatar.module.css`
- [ ] `ui/Badge.jsx` + `ui/Badge.module.css`
- [ ] `ui/Tooltip.jsx` + `ui/Tooltip.module.css`
- [ ] `ui/Modal.jsx` + `ui/Modal.module.css`
- [ ] `ui/Divider.jsx` + `ui/Divider.module.css`
- [ ] `ui/ScrollArea.jsx` + `ui/ScrollArea.module.css`
- [ ] `ui/Spinner.jsx` + `ui/Spinner.module.css`

---

## 3단계 — 전역 상태 Store (4개)
- [ ] `authStore.js` — accessToken, refreshToken, user 상태. 토큰 만료(15분) 전 자동 갱신 스케줄 포함
- [ ] `channelStore.js` — 채널 목록, 현재 선택 채널. workspaceId는 `VITE_WORKSPACE_ID` 환경변수 사용
- [ ] `messageStore.js` — 채널별 메시지 맵. STOMP `NotificationEvent` 수신 시 merge 로직 포함 (username/displayName은 authStore 또는 userCache에서 보완)
- [ ] `notificationStore.js` — 미읽음 카운트 관리 (SSE `/api/v1/notifications/stream` 현재 미발송 상태 — STOMP 이벤트로 대체)

---

## 4단계 — 인증 (4개) ← +1
- [ ] `router.jsx` — 보호 라우트 설정. `/oauth/callback` 라우트 포함
- [ ] `LoginPage.jsx` — OAuth2 로그인 버튼만 제공 (로컬 회원가입 없음). Google/GitHub 버튼 → `/login/oauth2/authorization/{provider}` 이동
- [ ] `OAuthCallbackPage.jsx` — **신규 추가.** URL 쿼리파라미터 `?accessToken=...&refreshToken=...` 파싱 → authStore 저장 → 메인 페이지 리디렉트
- [ ] `AuthProvider.jsx` — 앱 마운트 시 토큰 유효성 확인, 만료 임박 시 자동 refresh 처리

---

## 5단계 — WebSocket (2개) ← +1
- [ ] `useStompClient.js` — `/ws` 엔드포인트 연결. STOMP 헤더 `Authorization: Bearer {token}` 포함. 채널 구독: `/topic/channel/{channelId}`. 메시지 전송: `/app/channel/{channelId}/send`. 토큰 갱신 시 재연결 처리
- [ ] `useTokenRefresh.js` — **신규 추가.** accessToken 만료 1분 전 자동 `POST /api/v1/auth/refresh` 호출. 갱신 후 STOMP 재연결 트리거

---

## 6단계 — 레이아웃 (2개)
- [ ] `App.jsx`
- [ ] `MainLayout.jsx`

---

## 7단계 — 사이드바 (7개)
- [ ] `ChannelSidebar.jsx`
- [ ] `WorkspaceName.jsx` — `GET /api/v1/workspaces/{VITE_WORKSPACE_ID}` 로 워크스페이스명 표시 (목록 API 없으므로 단일 조회)
- [ ] `ChannelList.jsx` — `GET /api/v1/workspaces/{id}/channels`
- [ ] `ChannelItem.jsx` — 미읽음 뱃지 표시
- [ ] `DirectMessageList.jsx`
- [ ] `DmItem.jsx`
- [ ] `MyProfile.jsx` — `GET /api/v1/users/me`, `PUT /api/v1/users/me` (displayName, avatarUrl만 수정 가능)

---

## 8단계 — 채팅 영역 (10개) ← +1
- [ ] `ChatArea.jsx`
- [ ] `ChannelHeader.jsx`
- [ ] `MessageFeed.jsx` — 커서 기반 페이징 (`?cursor={lastMessageId}`). `Slice<MessageResponse>` 응답의 `hasNext`로 더보기 판단. 위로 스크롤 시 이전 메시지 로드
- [ ] `MessageBubble.jsx` — STOMP `NotificationEvent` 수신 시 낙관적 렌더링 후 `messageStore`와 merge. `NotificationEvent`에 없는 필드(username, displayName, isEdited)는 로컬 state에서 보완
- [ ] `MessageContent.jsx`
- [ ] `MarkdownRenderer.jsx`
- [ ] `CodeBlock.jsx`
- [ ] `ReactionBar.jsx` — `POST /api/v1/messages/{id}/reactions`, `DELETE /api/v1/messages/{id}/reactions/{emoji}`. 응답에 갱신된 반응 state 없으므로 낙관적 업데이트 처리
- [ ] `ThreadPreview.jsx` — parentId 기반으로 쓰레드 수 표시
- [ ] `useMessageSearch.js` — **신규 추가.** `GET /api/v1/search/messages?channelId=&q=` 호출 훅. `SearchResponse: { keyword, totalCount, results }` 처리

---

## 9단계 — 입력 영역 (4개) ← +1
- [ ] `InputArea.jsx`
- [ ] `FormatToolbar.jsx`
- [ ] `MessageInput.jsx` — 메시지 전송은 STOMP `/app/channel/{channelId}/send`로만 처리 (REST 없음)
- [ ] `FileUploadButton.jsx` — **신규 추가.** 파일 먼저 `POST /api/v1/files/upload` (messageId 없이 전송 후 fileId 획득) → fileId를 메시지 content에 포함해 STOMP 전송. 50MB 제한 안내

---

## 10단계 — 우측 패널 & 스레드 (5개) ← +1
- [ ] `RightPanel.jsx`
- [ ] `PinnedMessages.jsx` — `GET /api/v1/channels/{id}/pins`. 핀 추가/삭제: `POST/DELETE /api/v1/messages/{id}/pin?channelId=`. 응답 body 없으므로 낙관적 업데이트
- [ ] `MemberList.jsx` — `GET /api/v1/users` + `POST/DELETE /api/v1/channels/{id}/members`
- [ ] `ThreadDrawer.jsx` — `GET /api/v1/messages/{id}/threads`. 쓰레드 전송: STOMP `/app/channel/{channelId}/thread/{parentId}/send`
- [ ] `UserProfileModal.jsx` — **신규 추가.** `GET /api/v1/users/{userId}` 로 사용자 정보 표시

---

## 진행 현황

| 단계 | 전체 | 완료 | 진행률 |
|------|------|------|--------|
| 1단계 — 스타일 기반 | 1 | 0 | 0% |
| 2단계 — 공통 UI | 18 | 0 | 0% |
| 3단계 — 전역 상태 | 4 | 0 | 0% |
| 4단계 — 인증 | 4 | 0 | 0% |
| 5단계 — WebSocket | 2 | 0 | 0% |
| 6단계 — 레이아웃 | 2 | 0 | 0% |
| 7단계 — 사이드바 | 7 | 0 | 0% |
| 8단계 — 채팅 영역 | 10 | 0 | 0% |
| 9단계 — 입력 영역 | 4 | 0 | 0% |
| 10단계 — 우측 패널 & 스레드 | 5 | 0 | 0% |
| **합계** | **57** | **0** | **0%** |
