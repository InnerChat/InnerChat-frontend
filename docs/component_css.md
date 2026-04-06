# Component & CSS 명세 — DevTalk Dark 스타일 기준

> `devtalk_app_preview_dark.html` 시안을 React + CSS Modules 구조로 변환한 명세.
> TODO_frontend.md의 컴포넌트 분류와 1:1 대응.

---

## 1. CSS 변수 (global.css)

### 색상 토큰
```css
/* Background */
--color-background-primary:   #1e1f22;   /* 메인 채팅 배경 */
--color-background-secondary: #2b2d31;   /* 사이드바·우측패널 배경 */
--color-background-tertiary:  #111214;   /* 앱 최외곽 배경 */

/* 상태별 배경 (반투명) */
--color-background-info:    rgba(88, 101, 242, 0.18);
--color-background-success: rgba(35, 165,  89, 0.18);
--color-background-warning: rgba(240, 178,  50, 0.18);
--color-background-danger:  rgba(240,  71,  71, 0.18);

/* Text */
--color-text-primary:   #e3e5e8;
--color-text-secondary: #a3a6aa;
--color-text-tertiary:  #6d6f78;

/* 상태별 텍스트 */
--color-text-info:    #7289da;
--color-text-success: #3ba55c;
--color-text-warning: #faa81a;
--color-text-danger:  #ed4245;

/* Border */
--color-border-tertiary:  rgba(255,255,255,0.06);
--color-border-secondary: rgba(255,255,255,0.10);
--color-border-primary:   rgba(255,255,255,0.16);
--color-border-info:    rgba(88, 101, 242, 0.45);
--color-border-success: rgba(35, 165,  89, 0.45);
--color-border-warning: rgba(240, 178,  50, 0.45);
--color-border-danger:  rgba(240,  71,  71, 0.45);
```

### 타이포그래피 & 기타
```css
--font-sans: system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;

--border-radius-sm: 4px;
--border-radius-md: 8px;
--border-radius-lg: 12px;
```

### 아바타 색상 팔레트 (사용자별 할당)
| 키 | background | color |
|----|-----------|-------|
| green  | `rgba(35,165,89,0.22)`   | `#3ba55c` |
| yellow | `rgba(240,178,50,0.22)`  | `#faa81a` |
| indigo | `rgba(88,101,242,0.22)`  | `#9aadff` |
| red    | `rgba(240,71,71,0.22)`   | `#ed4245` |

---

## 2. 공통 UI 컴포넌트 (`ui/`)

### `Avatar.jsx` / `Avatar.module.css`
아바타 원형 컴포넌트. size(sm·md·lg), colorKey prop으로 팔레트 자동 적용.

| 크기 | 지름 | 폰트 |
|------|------|------|
| sm   | 20px | 10px |
| md   | 28px | 11px |
| lg   | 32px | 12px |

```css
.avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  flex-shrink: 0;
}
.sm { width: 20px; height: 20px; font-size: 10px; }
.md { width: 28px; height: 28px; font-size: 11px; }
.lg { width: 32px; height: 32px; font-size: 12px; }
```

---

### `Badge.jsx` / `Badge.module.css`
미읽음 카운트 표시. variant: danger(기본) | info.

```css
.badge {
  background: var(--color-background-danger);
  color: var(--color-text-danger);
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 8px;
  margin-left: auto;
}
```

---

### `Button.jsx` / `Button.module.css`
variant: primary(#5865f2 fill) | ghost(투명 테두리) | icon(28×28 정사각).

```css
/* icon variant — 헤더·툴바에서 사용 */
.icon {
  width: 28px; height: 28px;
  border-radius: var(--border-radius-md);
  border: 0.5px solid var(--color-border-secondary);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
}
.icon:hover { background: var(--color-background-secondary); }

/* primary — 전송 버튼 */
.primary {
  background: #5865f2;
  border-radius: 6px;
  color: #fff;
  width: 28px; height: 28px;
}

/* tool — 포맷 툴바 소형 버튼 */
.tool {
  width: 26px; height: 26px;
  border-radius: 5px;
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: 12px;
}
.tool:hover { background: rgba(255,255,255,0.07); color: var(--color-text-secondary); }
```

---

### `Divider.jsx` / `Divider.module.css`
날짜 구분선.

```css
.divider { display: flex; align-items: center; gap: 10px; margin: 10px 0; }
.line { flex: 1; height: 0.5px; background: var(--color-border-tertiary); }
.text { font-size: 11px; color: var(--color-text-tertiary); }
```

---

### `Input.jsx` / `Input.module.css`
메시지 입력창 래퍼.

```css
.box {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  padding: 8px 12px;
  background: #2e3035;
}
.field {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-tertiary);
}
```

---

### `Modal.jsx` / `Modal.module.css`
`UserProfileModal`, `ThreadDrawer` 등에서 사용. 기본 overlay + card 구조.

---

### `ScrollArea.jsx` / `ScrollArea.module.css`
`overflow-y: auto` 래퍼. 스크롤바 커스터마이징(얇은 다크 스타일).

---

### `Spinner.jsx` / `Spinner.module.css`
메시지 로딩·무한스크롤 인디케이터.

---

### `Tooltip.jsx` / `Tooltip.module.css`
아이콘 버튼 hover 시 표시. 작은 다크 말풍선.

---

## 3. 레이아웃

### `MainLayout.jsx` — 전체 앱 껍데기
```css
.app {
  display: flex;
  height: 100vh;          /* 실제 앱은 100vh 사용 */
  background: var(--color-background-primary);
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}
```
> 시안의 `max-width: 960px` / `height: 580px`는 프리뷰 전용. 실 앱은 전체 화면.

---

## 4. 사이드바

### `ChannelSidebar.jsx` / `ChannelSidebar.module.css`
```css
.sidebar {
  width: 220px;
  min-width: 220px;
  background: var(--color-background-secondary);
  border-right: 0.5px solid var(--color-border-tertiary);
  display: flex;
  flex-direction: column;
}
```

---

### `WorkspaceName.jsx`
```css
.header { padding: 14px 14px 10px; border-bottom: 0.5px solid var(--color-border-tertiary); }
.name   { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
.sub    { font-size: 11px; color: var(--color-text-tertiary); margin-top: 1px; }
```

---

### `ChannelList.jsx` / `ChannelItem.jsx`
섹션 헤더 + 채널 목록.

```css
.sectionLabel {
  font-size: 11px;
  color: var(--color-text-tertiary);
  padding: 0 14px 4px;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background .12s;
}
.item:hover  { background: rgba(255,255,255,0.04); }
.item.active {
  background: var(--color-background-info);
  color: #9aadff;
  font-weight: 500;
}
.icon { font-size: 13px; width: 16px; text-align: center; }
```

---

### `DirectMessageList.jsx` / `DmItem.jsx`
```css
.dmItem {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
}
.dmItem:hover { background: rgba(255,255,255,0.04); }
.onlineDot {
  width: 7px; height: 7px;
  background: #3ba55c;
  border-radius: 50%;
  margin-left: auto;
}
```

---

### `MyProfile.jsx`
```css
.footer {
  margin-top: auto;
  padding: 10px 14px;
  border-top: 0.5px solid var(--color-border-tertiary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.name   { font-size: 12px; font-weight: 500; color: var(--color-text-primary); }
.status { font-size: 11px; color: var(--color-text-success); }
```

---

## 5. 채팅 영역

### `ChannelHeader.jsx`
```css
.header {
  padding: 12px 18px;
  border-bottom: 0.5px solid var(--color-border-tertiary);
  display: flex;
  align-items: center;
  gap: 10px;
}
.title { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
.desc  { font-size: 12px; color: var(--color-text-tertiary); margin-left: 6px; }
.actions { margin-left: auto; display: flex; gap: 8px; }
```

---

### `MessageFeed.jsx`
```css
.feed {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
```

---

### `MessageBubble.jsx`
```css
.group {
  display: flex;
  gap: 10px;
  padding: 4px 0;
}
.body  { flex: 1; min-width: 0; }
.meta  { display: flex; align-items: baseline; gap: 8px; margin-bottom: 3px; }
.name  { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
.time  { font-size: 11px; color: var(--color-text-tertiary); }
```

---

### `MessageContent.jsx` / `MarkdownRenderer.jsx`
```css
.text {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.55;
}
.inlineCode {
  font-family: var(--font-mono);
  font-size: 12px;
  background: #2e3035;
  border: 0.5px solid rgba(255,255,255,0.1);
  padding: 1px 5px;
  border-radius: 4px;
  color: #9aadff;
}
```

---

### `CodeBlock.jsx`
```css
.block {
  margin-top: 6px;
  background: #1a1b1e;
  border: 0.5px solid rgba(255,255,255,0.08);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}
.langBar {
  font-size: 11px;
  color: var(--color-text-tertiary);
  padding: 5px 10px;
  border-bottom: 0.5px solid rgba(255,255,255,0.07);
  display: flex;
  justify-content: space-between;
  background: #212225;
}
.content {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 10px;
  color: #cdd6f4;
  line-height: 1.6;
  white-space: pre;
  overflow-x: auto;
}
/* 신택스 하이라이트 */
.kw  { color: #cba6f7; }  /* keyword */
.fn  { color: #89dceb; }  /* function */
.str { color: #a6e3a1; }  /* string */
.cm  { color: #585b70; }  /* comment */
```

---

### `ReactionBar.jsx`
```css
.bar { display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap; }
.reaction {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.05);
  border: 0.5px solid rgba(255,255,255,0.10);
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  color: var(--color-text-secondary);
}
.reaction.mine {
  border-color: rgba(88,101,242,0.6);
  background: rgba(88,101,242,0.18);
  color: #9aadff;
}
.reaction:hover { background: rgba(255,255,255,0.09); }
```

---

### `ThreadPreview.jsx`
```css
.preview {
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9aadff;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
}
.preview:hover { background: var(--color-background-info); }
.miniAvatar {
  width: 18px; height: 18px;
  border-radius: 50%;
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}
```

---

## 6. 입력 영역

### `InputArea.jsx`
```css
.area {
  padding: 10px 18px 14px;
  border-top: 0.5px solid var(--color-border-tertiary);
}
```

---

### `FormatToolbar.jsx`
`Button` (tool variant) 7개 나열: **B** / *I* / `</>` / 🔗 / 📎 / 😊 / 검색

```css
.toolbar { display: flex; gap: 4px; margin-bottom: 6px; }
```

---

### `MessageInput.jsx`
`Input` (box variant) + 전송 `Button` (primary variant) 조합.

---

### `FileUploadButton.jsx`
`Button` (tool variant) 📎, 숨겨진 `<input type="file">` 트리거.

---

## 7. 우측 패널

### `RightPanel.jsx`
```css
.panel {
  width: 230px;
  min-width: 230px;
  border-left: 0.5px solid var(--color-border-tertiary);
  display: flex;
  flex-direction: column;
  background: var(--color-background-secondary);
}
.panelHeader {
  padding: 12px 14px;
  border-bottom: 0.5px solid var(--color-border-tertiary);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.panelContent { padding: 12px 14px; flex: 1; overflow-y: auto; }
```

---

### `PinnedMessages.jsx`
```css
.pinnedItem {
  padding: 8px 10px;
  border: 0.5px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-md);
  margin-bottom: 8px;
  background: rgba(255,255,255,0.03);
}
.pinnedTitle {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-bottom: 4px;
  display: flex;
  gap: 5px;
  align-items: center;
}
.pinnedText { font-size: 12px; color: var(--color-text-secondary); line-height: 1.4; }
```

---

### `MemberList.jsx`
```css
.memberItem {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
  color: var(--color-text-primary);
}
.role {
  margin-left: auto;
  font-size: 10px;
  color: var(--color-text-tertiary);
  background: rgba(255,255,255,0.07);
  padding: 1px 6px;
  border-radius: 4px;
}
.sectionDivider {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin: 10px 0 6px;
  font-weight: 500;
}
```

---

### `ThreadDrawer.jsx`
우측 슬라이드 패널. `RightPanel`과 동일한 컨테이너 CSS 재사용.

---

### `UserProfileModal.jsx`
`Modal` 기반. Avatar(lg) + 이름/역할 + 온라인 상태 구성.

---

## 8. 인증 페이지

### `LoginPage.jsx`
배경 `--color-background-tertiary`. 중앙 카드(`--color-background-secondary`, `border-radius-lg`).
OAuth2 버튼은 `Button` primary variant 재사용.

---

## 요약 — 파일 목록

```
src/
├── styles/
│   └── global.css
├── ui/
│   ├── Avatar.jsx + Avatar.module.css
│   ├── Badge.jsx  + Badge.module.css
│   ├── Button.jsx + Button.module.css
│   ├── Divider.jsx + Divider.module.css
│   ├── Input.jsx  + Input.module.css
│   ├── Modal.jsx  + Modal.module.css
│   ├── ScrollArea.jsx + ScrollArea.module.css
│   ├── Spinner.jsx    + Spinner.module.css
│   └── Tooltip.jsx    + Tooltip.module.css
├── components/
│   ├── sidebar/
│   │   ├── ChannelSidebar.module.css
│   │   ├── WorkspaceName.module.css
│   │   ├── ChannelList.module.css
│   │   ├── ChannelItem.module.css
│   │   ├── DirectMessageList.module.css
│   │   ├── DmItem.module.css
│   │   └── MyProfile.module.css
│   ├── chat/
│   │   ├── ChannelHeader.module.css
│   │   ├── MessageFeed.module.css
│   │   ├── MessageBubble.module.css
│   │   ├── MessageContent.module.css
│   │   ├── CodeBlock.module.css
│   │   ├── ReactionBar.module.css
│   │   └── ThreadPreview.module.css
│   ├── input/
│   │   ├── InputArea.module.css
│   │   └── FormatToolbar.module.css
│   └── panel/
│       ├── RightPanel.module.css
│       ├── PinnedMessages.module.css
│       └── MemberList.module.css
└── layouts/
    └── MainLayout.module.css
```
