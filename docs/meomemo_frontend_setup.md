memo_memo_frontend_setup

memo_memo — 프론트엔드 프로젝트 생성 프로세스

> 작성일: 2026-03-26 | 대상: Electron + React + Vite 초기 셋업

---

## 목차

1. [사전 준비](#1-사전-준비)
2. [프로젝트 초기화](#2-프로젝트-초기화)
3. [패키지 설치](#3-패키지-설치)
4. [디렉토리 구조 생성](#4-디렉토리-구조-생성)
5. [설정 파일 작성](#5-설정-파일-작성)
6. [Electron 설정](#6-electron-설정)
7. [진입점 파일 작성](#7-진입점-파일-작성)
8. [실행 확인](#8-실행-확인)

---

## 1. 사전 준비

### 필수 설치 항목

| 항목    | 권장 버전   | 확인 명령       |
| ------- | ----------- | --------------- |
| Node.js | 20 LTS 이상 | `node -v`       |
| npm     | 10 이상     | `npm -v`        |
| Git     | 최신        | `git --version` |

### 버전 확인 후 진행

```bash
node -v   # v20.x.x 이상 확인
npm -v    # 10.x.x 이상 확인
```

---

## 2. 프로젝트 초기화

### 2.1 electron-vite 템플릿으로 프로젝트 생성

> `electron-vite`는 Electron + Vite를 위한 공식 빌드 도구로,
> main 프로세스 · preload · renderer(React) 구성을 한 번에 처리한다.

```bash
npm create @quick-start/electron@latest groundtalk-client
```

프롬프트 응답:

```
✔ Select a framework › react
✔ Add TypeScript? › No         (JavaScript 사용)
✔ Add Electron Updater plugin? › No
```

### “Add Electron Updater plugin?” 에 No를 선택하는 이유

**Electron Updater**는 배포된 앱이 새 버전을 자동으로 감지하고 업데이트하는 기능이다.
개발 로드맵 기준 **Phase 4 (13~16주)** 에 해당하는 항목으로, 지금 추가하면 아래 문제가 생긴다.

| 항목                | Yes 선택 시                                            | No 선택 시            |
| ------------------- | ------------------------------------------------------ | --------------------- |
| 초기 코드 복잡도    | 자동 업데이트 보일러플레이트 코드가 `main.js`에 추가됨 | 깔끔한 초기 구조 유지 |
| 동작 여부           | 업데이트 서버 없이는 어차피 동작 안 함                 | 무관                  |
| Phase 4 추가 난이도 | 차이 없음                                              | 차이 없음             |

> Yes를 선택해도 에러가 나지는 않는다. 단순히 쓰지 않는 코드가 추가되는 것뿐이다.
> 온프레미스 환경 특성상 자동 업데이트보다 **수동 배포(Docker 이미지 교체)** 가 주 방식이므로
> Phase 4 착수 시점에 필요 여부를 다시 검토한 후 추가하는 것을 권장한다.

### Phase 4에서 추가하는 방법 (참고)

```bash
npm install electron-updater
```

`electron/main.js`에 추가:

```jsx
import { autoUpdater } from 'electron-updater'

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify()
})
```

### 2.2 프로젝트 디렉토리 이동

```bash
cd groundtalk-client
```

### 2.3 생성된 기본 구조 확인

```
groundtalk-client/
├── src/
│   ├── main/
│   │   └── index.js          # Electron 메인 프로세스
│   ├── preload/
│   │   └── index.js          # 렌더러-메인 브릿지
│   └── renderer/
│       ├── index.html
│       └── src/              # React 렌더러 프로세스
│           ├── App.jsx
│           ├── main.jsx
│           ├── assets/
│           └── components/
├── resources/
│   └── icon.png
├── build/                    # 플랫폼별 아이콘
├── package.json
├── electron.vite.config.mjs  # Vite 설정 파일
└── electron-builder.yml
```

> **주의** — 문서에서 흔히 보이는 `electron/` 폴더 구조와 다르다.
> electron-vite는 메인·프리로드·렌더러를 모두 `src/` 하위로 분리한다.

---

## 3. 패키지 설치

### 3.1 기본 의존성 설치

```bash
npm install
```

### 3.2 라우터

```bash
npm install react-router-dom
```

### 3.3 상태 관리

```bash
npm install zustand
```

### 3.4 실시간 통신

```bash
npm install @stomp/stompjs sockjs-client
```

### 3.5 마크다운 & 코드 하이라이팅

```bash
npm install marked dompurify
npm install shiki
```

### 3.6 유틸리티

```bash
npm install axios
npm install clsx
```

> `clsx` : 조건부 CSS Modules 클래스 병합 유틸리티.
> 공통 컴포넌트(ui/)에서 variant/active 상태 처리 시 사용.
> (예: `clsx(styles.item, isActive && styles.active)`)

### 3.7 개발 의존성

```bash
npm install -D @vitejs/plugin-react
```

### 3.8 설치 후 package.json 주요 의존성 확인

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.x.x",
    "zustand": "^4.x.x",
    "@stomp/stompjs": "^7.x.x",
    "sockjs-client": "^1.x.x",
    "shiki": "latest",
    "marked": "^12.x.x",
    "dompurify": "^3.x.x",
    "axios": "^1.x.x",
    "clsx": "^2.x.x"
  }
}
```

---

## 4. 디렉토리 구조 생성

아래 구조대로 폴더와 파일을 생성한다.
`src/renderer/src/` 가 React 작업의 루트 디렉토리다.

```
groundtalk-client/
├── src/
│   ├── main/
│   │   └── index.js                  # Electron 메인 프로세스 (건드리지 않음)
│   ├── preload/
│   │   └── index.js                  # 프리로드 브릿지 (Phase 3에서 수정)
│   └── renderer/
│       ├── index.html
│       └── src/                      # ← React 작업 루트
│           ├── components/
│           │   ├── ui/               # 공통 컴포넌트 (디자인 시스템)
│           │   │   ├── Button.jsx
│           │   │   ├── Input.jsx
│           │   │   ├── Avatar.jsx
│           │   │   ├── Badge.jsx
│           │   │   ├── Tooltip.jsx
│           │   │   ├── Modal.jsx
│           │   │   ├── Divider.jsx
│           │   │   ├── ScrollArea.jsx
│           │   │   └── Spinner.jsx
│           │   ├── layout/
│           │   │   └── MainLayout.jsx
│           │   ├── sidebar/
│           │   │   ├── ChannelSidebar.jsx
│           │   │   ├── WorkspaceName.jsx
│           │   │   ├── ChannelList.jsx
│           │   │   ├── ChannelItem.jsx
│           │   │   ├── DirectMessageList.jsx
│           │   │   ├── DmItem.jsx
│           │   │   └── MyProfile.jsx
│           │   ├── chat/
│           │   │   ├── ChatArea.jsx
│           │   │   ├── ChannelHeader.jsx
│           │   │   ├── MessageFeed.jsx
│           │   │   ├── MessageBubble.jsx
│           │   │   ├── MessageContent.jsx
│           │   │   ├── MarkdownRenderer.jsx
│           │   │   ├── CodeBlock.jsx
│           │   │   ├── ReactionBar.jsx
│           │   │   └── ThreadPreview.jsx
│           │   ├── input/
│           │   │   ├── InputArea.jsx
│           │   │   ├── FormatToolbar.jsx
│           │   │   └── MessageInput.jsx
│           │   ├── panel/
│           │   │   ├── RightPanel.jsx
│           │   │   ├── PinnedMessages.jsx
│           │   │   └── MemberList.jsx
│           │   └── thread/
│           │       └── ThreadDrawer.jsx
│           ├── pages/
│           │   └── LoginPage.jsx
│           ├── stores/
│           │   ├── authStore.js
│           │   ├── channelStore.js
│           │   ├── messageStore.js
│           │   └── notificationStore.js
│           ├── hooks/
│           │   └── useStompClient.js
│           ├── styles/
│           │   └── index.css
│           ├── App.jsx
│           ├── router.jsx
│           └── main.jsx
├── tailwind.config.js
├── postcss.config.js
├── electron.vite.config.mjs
└── electron-builder.yml
```

### 폴더 일괄 생성 명령

```bash
mkdir -p src/renderer/src/components/ui
mkdir -p src/renderer/src/components/layout
mkdir -p src/renderer/src/components/sidebar
mkdir -p src/renderer/src/components/chat
mkdir -p src/renderer/src/components/input
mkdir -p src/renderer/src/components/panel
mkdir -p src/renderer/src/components/thread
mkdir -p src/renderer/src/pages
mkdir -p src/renderer/src/stores
mkdir -p src/renderer/src/hooks
mkdir -p src/renderer/src/styles
```

---

## 5. 설정 파일 작성

### 5.1 src/renderer/src/styles/global.css

디자인 토큰을 CSS 변수로 정의한다. 모든 컴포넌트의 `*.module.css`에서 이 변수를 참조한다.

```css
/* ── 색상 토큰 ── */
:root {
  /* Background */
  --color-bg-primary:   #1e1f22;
  --color-bg-secondary: #2b2d31;
  --color-bg-tertiary:  #111214;

  --color-bg-info:    rgba(88, 101, 242, 0.18);
  --color-bg-success: rgba(35, 165,  89, 0.18);
  --color-bg-warning: rgba(240, 178,  50, 0.18);
  --color-bg-danger:  rgba(240,  71,  71, 0.18);

  /* Text */
  --color-text-primary:   #e3e5e8;
  --color-text-secondary: #a3a6aa;
  --color-text-tertiary:  #6d6f78;

  --color-text-info:    #7289da;
  --color-text-success: #3ba55c;
  --color-text-warning: #faa81a;
  --color-text-danger:  #ed4245;

  /* Border */
  --color-border-tertiary:  rgba(255, 255, 255, 0.06);
  --color-border-secondary: rgba(255, 255, 255, 0.10);
  --color-border-primary:   rgba(255, 255, 255, 0.16);
  --color-border-info:    rgba(88, 101, 242, 0.45);
  --color-border-success: rgba(35, 165,  89, 0.45);
  --color-border-warning: rgba(240, 178,  50, 0.45);
  --color-border-danger:  rgba(240,  71,  71, 0.45);

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  font-family: var(--font-sans);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
}

/* ── 커스텀 스크롤바 ── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--color-border-primary);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover { background: var(--color-text-tertiary); }
```

### 5.2 electron.vite.config.mjs

`electron-vite`가 생성한 기본 파일에서 renderer 의 alias 설정만 추가한다.

```jsx
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        // @ → src/renderer/src/ 절대경로 alias
        '@': resolve('src/renderer/src'),
        '@ui': resolve('src/renderer/src/components/ui'),
        '@stores': resolve('src/renderer/src/stores'),
        '@hooks': resolve('src/renderer/src/hooks')
      }
    },
    plugins: [react()]
  }
})
```

---

## 6. Electron 설정

### 6.1 src/main/index.js

기본 생성 파일에서 창 크기·보안 옵션만 수정한다.

```jsx
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false // 보안: Node.js API 직접 접근 차단
    }
  })

  // 개발 환경: Vite dev server 연결
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

### 6.2 src/preload/index.js

렌더러(React)에서 필요한 Electron API만 선택적으로 노출한다.

```jsx
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

contextBridge.exposeInMainWorld('electron', electronAPI)

contextBridge.exposeInMainWorld('electronAPI', {
  // 데스크탑 알림 (Phase 3에서 구현)
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body })
})
```

---

## 7. 진입점 파일 작성

### 7.1 src/renderer/src/main.jsx

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### 7.2 src/renderer/src/App.jsx

```jsx
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

export default function App() {
  return <RouterProvider router={router} />
}
```

### 7.3 src/renderer/src/router.jsx

```jsx
import { createHashRouter } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import MainLayout from '@/components/layout/MainLayout'

// Electron에서는 createHashRouter 사용 (file:// 프로토콜 대응)
export const router = createHashRouter([
  {
    path: '/',
    element: <LoginPage />
  },
  {
    path: '/app',
    element: <MainLayout />
  }
])
```

### 7.4 src/renderer/src/pages/LoginPage.jsx (스켈레톤)

```jsx
import styles from './LoginPage.module.css'

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>GroundTalk</h1>
        {/* ui/Input, ui/Button 공통 컴포넌트 구현 후 교체 */}
        <p className={styles.placeholder}>로그인 폼 구현 예정</p>
      </div>
    </div>
  )
}
```

```css
/* LoginPage.module.css */
.page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--color-bg-tertiary);
}
.card {
  width: 384px;
  padding: 32px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-secondary);
  border: 0.5px solid var(--color-border-secondary);
}
.title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 24px;
}
.placeholder {
  font-size: 13px;
  color: var(--color-text-tertiary);
}
```

### 7.5 src/renderer/src/components/layout/MainLayout.jsx (스켈레톤)

```jsx
import styles from './MainLayout.module.css'

export default function MainLayout() {
  return (
    <div className={styles.layout}>
      {/* 사이드바 — ChannelSidebar 구현 후 교체 */}
      <aside className={styles.sidebar}></aside>

      {/* 채팅 영역 — ChatArea 구현 후 교체 */}
      <main className={styles.chat}></main>

      {/* 우측 패널 — RightPanel 구현 후 교체 */}
      <aside className={styles.panel}></aside>
    </div>
  )
}
```

```css
/* MainLayout.module.css */
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg-primary);
}
.sidebar {
  width: 220px;
  min-width: 220px;
  background: var(--color-bg-secondary);
  border-right: 0.5px solid var(--color-border-tertiary);
}
.chat {
  flex: 1;
  overflow: hidden;
  background: var(--color-bg-primary);
}
.panel {
  width: 230px;
  min-width: 230px;
  background: var(--color-bg-secondary);
  border-left: 0.5px solid var(--color-border-tertiary);
}
```

---

## 8. 실행 확인

### 8.1 개발 서버 실행

```bash
npm run dev
```

정상 실행 시 Electron 창이 열리고 LoginPage 스켈레톤 화면이 표시되어야 한다.

### 8.2 확인 체크리스트

```
□ Electron 창 정상 실행
□ 배경색이 #111214 (--color-bg-tertiary) 으로 표시
□ "GroundTalk" 텍스트 및 로그인 폼 영역 표시
□ 콘솔 에러 없음
□ CSS 변수 적용 확인 (개발자 도구 → Elements → :root 에서 변수 확인)
```

### 8.3 빌드 테스트 (선택)

```bash
npm run build        # 빌드
npm run preview      # 빌드 결과 미리보기
```

---

## 부록 — package.json scripts 정리

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "pack": "npm run build && electron-builder --dir",
    "dist": "npm run build && electron-builder"
  }
}
```

---

## 다음 단계

셋업 완료 후 개발물량 문서의 구현 순서에 따라 진행한다.

```
1단계 완료 (스타일 기반) ← 현재 단계
  global.css — CSS 변수 토큰 정의
     ↓
2단계: ui/ 공통 컴포넌트 구현 (각 컴포넌트 + *.module.css)
  Button → Input → Avatar → Badge → Tooltip
  → Modal → Divider → ScrollArea → Spinner
     ↓
3단계: Zustand Store 설계
  authStore / channelStore / messageStore / notificationStore
     ↓
4단계~: 인증 → WebSocket → 화면 컴포넌트 순서로 진행
```

---

_문서 끝 — GroundTalk 프론트엔드 셋업 가이드 v0.2 (CSS Modules 기반으로 전환)_
