# How the Frontend Knows What to Fetch — JWT Auth Flow Deep Dive

## The Short Answer

The **JWT token encodes the user's `storeId`** (which store they own) and **`role`** (what they're allowed to do). Every API request sends this token. The backend reads it to scope every database query to just that user's data — the frontend never decides *what* data to fetch, the backend enforces it.

---

## The Full Flow, Step by Step

### Phase 1 — Login: Creating the JWT

When a Store Admin like `alpha@demo.com` submits the login form, here's the exact call chain:

```mermaid
sequenceDiagram
    participant Browser
    participant AuthContext
    participant AxiosClient
    participant Express
    participant AuthService
    participant Prisma
    participant JWT

    Browser->>AuthContext: login("alpha@demo.com", "StoreAdmin123!")
    AuthContext->>AxiosClient: POST /api/auth/login
    AxiosClient->>Express: HTTP Request
    Express->>AuthService: auth.service.login()
    AuthService->>Prisma: findUnique({ email })
    Prisma-->>AuthService: User { id, role: STORE_ADMIN, storeId: "abc-123" }
    AuthService->>JWT: signToken({ userId, role, storeId })
    JWT-->>AuthService: "eyJhbGci..."
    AuthService-->>Express: { user, token }
    Express-->>Browser: 200 { data: { user, token } }
    Browser->>Browser: localStorage.setItem("token", "eyJhbGci...")
    AuthContext->>AuthContext: setUser(user), setToken(token)
```

#### Step 1: Frontend calls `authApi.login()`

In [Login.tsx](file:///Users/bot/Downloads/Projects/ShopifyMVP/frontend/src/pages/Login.tsx), the form submits and calls `login()` from `AuthContext`:

```ts
// AuthContext.tsx — login function
const login = async (email: string, password: string) => {
  const res = await authApi.login(email, password);   // POST /api/auth/login
  const { user: userData, token: authToken } = res.data;

  localStorage.setItem('token', authToken);   // ← persist token for future requests
  setToken(authToken);
  setUser(userData);
};
```

This calls [auth.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/frontend/src/api/auth.ts) which hits `POST /api/auth/login`.

#### Step 2: Backend validates credentials and creates the JWT

In [auth.service.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/backend/src/modules/auth/auth.service.ts#L53-L74):

```ts
export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  // ... password validation ...

  // THIS is the critical part — what goes INTO the JWT:
  const token = signToken({
    userId: user.id,         // "f47ac10b-..."
    role: user.role,         // "STORE_ADMIN"
    storeId: user.storeId,   // "abc-123-..." (or null for Super Admin)
  });

  return { user: excludePassword(user), token };
};
```

#### Step 3: JWT is signed with these 3 fields

In [jwt.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/backend/src/utils/jwt.ts):

```ts
export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};
```

The [JwtPayload](file:///Users/bot/Downloads/Projects/ShopifyMVP/backend/src/types/index.ts#L7-L16) type is:

```ts
interface JwtPayload {
  userId: string;          // WHO is making the request
  role: Role;              // WHAT they're allowed to do (SUPER_ADMIN | STORE_ADMIN)
  storeId: string | null;  // WHICH store's data they can access
}
```

So the JWT token is literally a signed JSON blob containing `{ userId, role, storeId }`. For `alpha@demo.com`, the `storeId` is the UUID of "Demo Store Alpha".

---

### Phase 2 — Every Subsequent Request: Automatic Token Injection

After login, the token lives in `localStorage`. The Axios interceptor in [client.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/frontend/src/api/client.ts#L20-L27) **automatically attaches it to every request**:

```ts
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  // ← injected on EVERY call
  }
  return config;
});
```

So when the Store Management page calls `productsApi.getProducts()`, the actual HTTP request looks like:

```
GET /api/products?page=1&limit=1000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

The frontend doesn't say "give me products for store abc-123". It just says "give me products" — the token carries the identity.

---

### Phase 3 — Backend Decodes the Token and Scopes the Query

#### Step 1: `authenticate` middleware extracts `req.user`

Every protected route passes through [auth.middleware.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/backend/src/middleware/auth.middleware.ts#L16-L56):

```ts
export const authenticate = async (req, _res, next) => {
  const token = req.headers.authorization.split(' ')[1];  // "eyJhbGci..."

  const decoded = verifyToken(token);
  // decoded = { userId: "f47ac10b-...", role: "STORE_ADMIN", storeId: "abc-123-..." }

  // Fresh lookup from DB to catch role/store changes since token was issued:
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { storeId: true, role: true },
  });

  req.user = {
    userId: decoded.userId,
    role: user.role,        // always latest from DB
    storeId: user.storeId,  // always latest from DB
  };

  next();  // proceed to the controller
};
```

> [!IMPORTANT]
> The middleware doesn't just trust the token blindly — it re-fetches the user's `role` and `storeId` from the database on **every request**. This means if a Super Admin changes a user's store assignment, the very next API call reflects the change, even though the old token is still in the browser.

#### Step 2: `requireRole` middleware checks authorization

For product routes, [product.routes.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/backend/src/modules/products/product.routes.ts#L13-L14) applies two guards:

```ts
router.use(authenticate);                // ← decode JWT → req.user
router.use(requireRole('STORE_ADMIN'));   // ← reject if not STORE_ADMIN
```

The [role middleware](file:///Users/bot/Downloads/Projects/ShopifyMVP/backend/src/middleware/role.middleware.ts) simply checks:

```ts
if (!allowedRoles.includes(req.user.role)) {
  throw new ApiError(403, 'Access denied.');
}
```

#### Step 3: Service uses `req.user.storeId` to scope the query

This is the key — in [product.service.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/backend/src/modules/products/product.service.ts#L24-L51):

```ts
export const getProducts = async (caller: JwtPayload, pagination) => {
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: caller.storeId },   // ← ONLY this store's products
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({
      where: { storeId: caller.storeId },   // ← same filter for count
    }),
  ]);
  // ...
};
```

**`caller.storeId` comes from `req.user` (which came from the JWT).** The frontend never tells the backend which store to query — the backend derives it from the token. This is called **tenant isolation**.

---

### Phase 4 — Page Load: Putting it All Together

Here's what happens when a Store Admin lands on `/manage` after login:

```mermaid
sequenceDiagram
    participant StoreManagement
    participant storesApi
    participant productsApi
    participant AxiosClient
    participant Backend

    Note over StoreManagement: Component mounts, reads user from AuthContext
    StoreManagement->>storesApi: getStoreById(user.storeId)
    storesApi->>AxiosClient: GET /api/stores/{storeId}
    Note over AxiosClient: Interceptor adds "Bearer eyJ..." header
    AxiosClient->>Backend: GET /api/stores/{storeId} + JWT
    Note over Backend: authenticate → req.user.storeId = "abc-123"
    Backend-->>StoreManagement: Store { name, slug, isActive }

    StoreManagement->>productsApi: getProducts({ page: 1, limit: 1000 })
    productsApi->>AxiosClient: GET /api/products?page=1&limit=1000
    AxiosClient->>Backend: GET /api/products + JWT
    Note over Backend: product.service uses req.user.storeId in WHERE clause
    Backend-->>StoreManagement: Product[] (only this store's products)
```

In [StoreManagement.tsx](file:///Users/bot/Downloads/Projects/ShopifyMVP/frontend/src/pages/StoreManagement.tsx):

```ts
const { user } = useAuth();   // user.storeId is available from AuthContext

// Fetch this admin's store details
const fetchStoreDetails = async () => {
  const res = await storesApi.getStoreById(user.storeId);  // explicit storeId in URL
  setStore(res.data);
};

// Fetch products — NO storeId passed! Backend scopes it via JWT
const fetchProducts = async () => {
  const res = await productsApi.getProducts({ page: 1, limit: 1000 });
  setProducts(res.data.products);
};
```

Notice the difference:
- **Store details**: The frontend passes `user.storeId` in the URL path (`/stores/{id}`) because the route is `GET /stores/:id`, which is shared by both roles.
- **Products**: The frontend passes **nothing about the store**. The backend reads `req.user.storeId` from the JWT and applies `WHERE storeId = ?` automatically.

---

### Phase 5 — Session Restore on Page Refresh

When the user refreshes the page, the token is still in `localStorage`. [AuthContext.tsx](file:///Users/bot/Downloads/Projects/ShopifyMVP/frontend/src/context/AuthContext.tsx#L59-L75) runs this on mount:

```ts
useEffect(() => {
  const init = async () => {
    if (token) {                               // token from localStorage
      try {
        const res = await authApi.getProfile(); // GET /api/auth/profile (with JWT)
        setUser(res.data);                      // restores user object including store
      } catch {
        // token expired or invalid → clear everything
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  };
  init();
}, [token]);
```

The `getProfile` call hits [auth.service.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/backend/src/modules/auth/auth.service.ts#L79-L90):

```ts
export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { store: true },   // ← joins the Store table
  });
  return excludePassword(user);
};
```

This returns the full user object **with the nested store** (name, slug, isActive). That's why `user.store?.name` works in the Navbar — it comes from this profile call.

---

## Summary: Who Decides What Data to Show?

| Question | Answer | Where |
|---|---|---|
| Which store does this user own? | `storeId` encoded in the JWT at login time | [auth.service.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/backend/src/modules/auth/auth.service.ts#L67-L71) |
| How does the token get on every request? | Axios request interceptor reads `localStorage` | [client.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/frontend/src/api/client.ts#L20-L27) |
| How does the backend read the token? | `authenticate` middleware decodes it → `req.user` | [auth.middleware.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/backend/src/middleware/auth.middleware.ts#L16-L56) |
| How are products scoped to one store? | `WHERE storeId = req.user.storeId` in Prisma query | [product.service.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/backend/src/modules/products/product.service.ts#L37) |
| How does the frontend get the store name? | `GET /auth/profile` includes `{ store: true }` join | [auth.service.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/backend/src/modules/auth/auth.service.ts#L82) |
| What if the token expires? | Axios 401 interceptor clears token and redirects to `/login` | [client.ts](file:///Users/bot/Downloads/Projects/ShopifyMVP/frontend/src/api/client.ts#L39-L41) |
