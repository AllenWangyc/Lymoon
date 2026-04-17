# Frontend Development Guide

## Third-Party Auth: Google & Apple Sign-In (iOS)

### Google Sign-In: Expo Go vs EAS Build 的差异

**核心问题：** Google 已对 native installed-app clients 禁用 implicit id_token flow。EAS build 中使用 `useIdTokenAuthRequest` 会返回 `code` 而非 `id_token`，导致登录失败。

**解决方案：** 根据运行环境分支处理：

```typescript
const inExpoGo = Constants.executionEnvironment === 'storeClient';

const [request, , promptAsync] = Google.useAuthRequest({
  clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  iosClientId: inExpoGo ? undefined : (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? ''),
  redirectUri: inExpoGo
    ? 'https://auth.expo.io/@<slug>/<project>'
    : `com.googleusercontent.apps.<IOS_CLIENT_ID>:/oauth2redirect/google`,
  responseType: inExpoGo ? AuthSession.ResponseType.IdToken : AuthSession.ResponseType.Code,
  usePKCE: !inExpoGo,
  scopes: ['openid', 'email', 'profile'],
});
```

- **Expo Go**: Web client ID + Expo proxy → implicit flow → `result.params.id_token` 直接可用
- **EAS build**: iOS client ID + reverse-DNS scheme → PKCE code flow → 需要 `exchangeCodeAsync` 换取 `id_token`

**PKCE code exchange（EAS build 专用）：**

```typescript
const tokenResponse = await AuthSession.exchangeCodeAsync(
  {
    code,
    redirectUri: IOS_REDIRECT,
    clientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
    extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : {},
  },
  { tokenEndpoint: 'https://oauth2.googleapis.com/token' }
);
const idToken = tokenResponse.idToken;
```

> iOS native client 不需要 `client_secret`，PKCE 即可完成验证。

**app.json 必须配置 CFBundleURLSchemes：**

```json
"ios": {
  "infoPlist": {
    "CFBundleURLTypes": [{
      "CFBundleURLSchemes": [
        "com.googleusercontent.apps.<IOS_CLIENT_ID>"
      ]
    }]
  }
}
```

没有这个配置，reverse-DNS redirect URI 无法被 iOS 拦截，PKCE 流程会卡住。

---

### Apple Sign-In: 首次登录 null identityToken

**核心问题：** 首次安装后调用 `AppleAuthentication.signInAsync()`，iOS 可能返回 credential 对象但 `identityToken` 为 `null`。原因是 iOS 在首次授权时尚未完全建立 Apple ID credential session。

**解决方案：** 检测到 null 时自动 retry 一次：

```typescript
let credential = await AppleAuthentication.signInAsync({ requestedScopes: [...] });

if (!credential.identityToken) {
  credential = await AppleAuthentication.signInAsync({ requestedScopes: [...] });
}
```

**必须静默处理 ERR_CANCELED：**

```typescript
} catch (e: unknown) {
  const code = (e as { code?: string }).code;
  if (code === 'ERR_CANCELED') return; // 用户主动取消，不显示错误
  setErrorMsg('Apple sign-in failed. Please try again.');
}
```

**如何重置 Apple Sign-In 状态（测试用）：**

Settings → [Apple ID] → Password & Security → Apps Using Apple ID → Stop Using Apple ID

---

### Session Persistence: Zustand + expo-secure-store

**核心问题：** 不持久化 JWT 的话，每次 app 冷启动（force-quit 后重开）都会跳回登录页。

**解决方案：** Zustand `persist` middleware + `expo-secure-store` 作为 storage backend：

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

const secureStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ ... }),
    {
      name: 'lymoon-auth',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
```

**必须用 `_hasHydrated` 门控路由：**

```typescript
// app/index.tsx
export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  if (!hasHydrated) return null; // 等待 SecureStore 异步读取完成

  return <Redirect href={isAuthenticated ? '/(app)/' : '/(auth)/login'} />;
}
```

没有这个 `null` 返回，`isAuthenticated` 在 rehydration 完成前始终为 `false`，导致已登录用户每次冷启动都被踢回登录页。

---

## Navigation Patterns

*(待补充)*

## Reusable UI Patterns

*(待补充)*
