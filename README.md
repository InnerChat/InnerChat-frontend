# InnerChat Frontend

Electron + React 기반의 팀 협업 채팅 데스크탑 애플리케이션.

## Tech Stack

- **Electron** 39 + **electron-vite** 5
- **React** 19 + **React Router** 7
- **Zustand** 5 (전역 상태)
- **STOMP over SockJS** (실시간 통신)
- **CSS Modules** (스타일링)

## Requirements

- Node.js 18+
- Java 21 (백엔드 실행 시)

## Project Setup

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
# Windows 설치파일
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### Code Quality

```bash
npm run lint      # ESLint 검사
npm run format    # Prettier 포맷
```

## Environment Variables

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WORKSPACE_ID=1
```

## Project Structure

```
src/
├── main/index.js          # Electron 메인 프로세스
├── preload/index.js       # contextBridge (window.electronAPI)
└── renderer/src/
    ├── App.jsx            # RouterProvider 루트
    ├── router.jsx         # createHashRouter
    ├── stores/            # Zustand 전역 상태
    ├── hooks/             # useStompClient, useTokenRefresh 등
    ├── pages/             # LoginPage, OAuthCallbackPage
    └── components/
        ├── ui/            # 디자인 시스템 원자 컴포넌트
        ├── layout/        # MainLayout, AuthProvider
        ├── sidebar/       # ChannelSidebar
        ├── chat/          # ChatArea
        ├── input/         # InputArea
        ├── panel/         # RightPanel, MemberList 등
        └── thread/        # ThreadDrawer
```

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
