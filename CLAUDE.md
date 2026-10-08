# Punch ID

Monorepo: `client/` (Expo / React Native, TypeScript) and `server/`.

## Client UI rules

### Visual theme
- Dark UI throughout. The screen background is `theme.colors.backgroundSecondary` (#0F0F0E). Cards use `theme.colors.backgroundPrimary` (#19191A) with a 1px `theme.colors.border` border and `rounded-2xl`. Raised or inset surfaces (thumbnails, avatar, dropdown menus) use `theme.colors.backgroundTertiary`.
- Brand red (`theme.colors.primary`) is the only accent. Use it for primary buttons, icons in quick-action cards, links ("View All", "Learn more →"), the active selection, and highlighted borders such as the language selector. Primary buttons and QR scan lines get a red glow: `shadowColor: theme.colors.primary`, `shadowOpacity`, `shadowRadius`.
- Status colors are fixed. **Open** = `error` (red), **In Progress** = `warning` (amber), **Completed** = `success` (green), **Late** = `late` (purple). Badges show the solid color as text on its `*Muted` tint. Use `components/StatusBadge.tsx` and don't restyle statuses inline.
- Status values come from the server as `'Open' | 'In progress' | 'Complete' | 'Late'` (the `PunchStatus` type in `src/types/punchTask.ts`). Show them through `statusLabels` from `StatusBadge.tsx`, never the raw value. The project summary ring always shows all four statuses.
- Typography:
  - Section titles: `text-lg font-extrabold uppercase tracking-wide`.
  - Hero/display text: `font-black uppercase`, with the red half in `italic`.
  - Body text: `textSecondary`. Meta/footer text: `textMuted`. Headings: `textPrimary`.
- Brand wordmark: "PUNCH" in `textPrimary` and "ID" in `primary`, both `font-black italic`, with the tagline "SMART PUNCH LIST TAPE" underneath.
- Icons come from `@react-native-vector-icons/ant-design` (`AntDesign`). Check that a name exists in `node_modules/@react-native-vector-icons/ant-design/glyphmaps/AntDesign.json` before using it.
- Charts and graphics use `react-native-svg` (see the donut chart in `Home.tsx`).

### Styling
- Use Tailwind (NativeWind) `className` for layout, spacing, sizing, radius and typography.
- Colors always come from `@/utils/theme` through the `style` prop (`style={{ color: theme.colors.textPrimary }}`). Don't hardcode hex values in `className` or components. If a color is missing, add a token to `src/utils/theme.ts`.
- When a component reuses class strings, put them in a `styles` object of className strings at the top of the file, as `SignUp.tsx` and `Home.tsx` do.
- Layout is mobile-first. The bottom tab bar replaces any desktop sidebar from mockups. Multi-column desktop layouts collapse to a single scrolling column. Grids use `flex-row flex-wrap justify-between` with percentage widths (for example `w-[48.5%]` for two columns).
- `App.tsx` already applies the top safe area, so screens don't add another `SafeAreaView`.

### Components and files
- Screen-specific subcomponents live in the screen file as small `FC`s above the screen component. Move a component to `client/components/` once a second screen needs it.
- Shared domain types go in `src/types/` and mirror the server models. Hooks map Mongo's `_id` to `id` before data reaches components (see `mapJob` and `mapTask`).
- Shared components already in `client/components/`:
  - `JobSelect`: the job site dropdown. It's bound to the jobs store, so selecting a job updates `currentJob` app-wide. `allowAdd` adds a "+ Add New Job Site" option; the new-job modal and create logic live inside the component, so screens don't reimplement them.
  - `StatusBadge`: the status pill.
- When matching a mockup, keep the existing layout and styling when wiring in real data. Show an empty-state message (`textMuted`, centered) when a list is empty instead of hiding the section.
- Import with path aliases (`@/utils/...`, `@/components/...`), not long relative paths.

### Navigation
- Stack routes are typed with `AppStackParamList`, and tabs with `TabParamList` from `src/navigator/TabNavigator.tsx`.
- To navigate across tabs from a stack screen, use `CompositeNavigationProp<NavigationProp<AppStackParamList>, NavigationProp<TabParamList>>`.

### Data fetching
- Follow the pattern in `src/views/auth/SignUp.tsx`:
  1. `setLoading(true)`.
  2. `const res = await runAxiosAsync<T>(client.get/post(...))`. Use `authClient` from `useClient()` for authenticated routes.
  3. If `res.error`, call `showErrorToast({ description: res.error, toast, toastId, setToastId })`, then `setLoading(false)` and return.
  4. If `res.data`, update state.
  5. `setLoading(false)`.
- Until an endpoint exists, use dummy data through `mockRequest<T>(DUMMY_DATA)` from `src/api/mockRequest.ts`. It returns the same `{ data, error }` shape as `runAxiosAsync`, so switching to the real API changes only that one call. Leave a `// TODO:` naming the planned endpoint, and delete the dummy data once the screen uses the real endpoint.
- For data loaded on mount, the fetch function returns the data (or `null` after showing the error toast). Set state in the effect's `.then(...)` callback. Calling a function that runs `setState` directly inside `useEffect` fails the `react-hooks/set-state-in-effect` lint rule. See `Home.tsx`.
- Validate input on the client with `yupValidate(schema, values)` before sending a request. Client schemas in `src/validation/` mirror the server schemas in `server/src/validation/`, so keep both in sync.
- Job data lives in the `jobs` Redux slice (`jobs`, `currentJob`, `pending`). Always go through `useJobs()` (`fetchJobs`, `createJob`, `selectJob`) rather than calling the job endpoints directly. `selectJob` also saves the choice to asyncStorage (`Keys.CURRENT_JOB`) so it survives app restarts.
- Screens showing job-scoped data (the Home dashboard, for example) read `currentJob` from the store. They reload in a `useEffect` keyed on `currentJob?.id`, with a `cancelled` flag in the cleanup so a slow response for a previously selected job can't overwrite the new one.
- Punch tasks are fetched with `usePunchTasks().fetchTasks(jobId)`, which returns `{ tasks, error }`. Tasks are screen state, not Redux state.
- The logged-in user (`name`, `email`, `avatar`) comes from the auth store (`useSelector(getAuthState).profile`). Never hardcode user details.
- File uploads are sent as `FormData` with `'Content-Type': 'multipart/form-data'`.
  - On native, append files as `{ uri, name, type }`. On web, the picker returns a `File` object; append that instead.
  - Photos and videos come from the camera roll via `expo-image-picker` (`launchImageLibraryAsync`). Any other file uses `expo-document-picker`. Normalise either result to the `PickedFile` shape (`uri`, `name`, `mimeType`, `size`, `file`) before uploading.
  - The maximum file size is 100MB, Cloudinary's limit for a single upload request.
- Dates use `@react-native-community/datetimepicker`. On iOS it's the inline `compact` picker with `themeVariant='dark'`; on Android, `DateTimePickerAndroid.open`. Web has no native picker, so it falls back to a text input. Use `onValueChange`, not the deprecated `onChange`. Send dates to the server as `YYYY-MM-DD` strings.

### Form screens
- Each form step is a numbered card (`1. Job Site`, `2. Register QR`, …) with an uppercase title and a `textSecondary` subtitle.
- Inputs are gluestack `Input`/`InputField` with `rounded-xl border bg-transparent`, the `theme.colors.border` border color, and `textPrimary` text.
- Selected choice cards get a `primary` border, a `primaryMuted` background and a red `check-circle` badge. Radio buttons are custom: a `primary` ring with a filled dot.
- The submit button sits at the bottom: red when the form is valid, `backgroundTertiary` while disabled, and a `Spinner` while the request is in flight. Next to it goes an outlined Cancel button.
- In this gluestack theme, `text-primary`/`bg-primary` classes resolve to near-white in dark mode, not brand red. Use `theme.colors.primary` through `style`.
- Gluestack Select/Actionsheet defaults to its own grey tokens. Theme it per use through `style` props: backdrop `overlay`, content `backgroundPrimary` with a top `border`, items transparent or `primaryMuted` when selected, item text via `textStyle={{ style: {...} }}`. Don't edit the generated files in `components/ui/`. See `JobSelect.tsx`.
- Bottom sheets and anything pinned to the bottom of the screen add `useSafeAreaInsets().bottom` to their bottom padding (plus ~24px breathing room), so text and buttons clear the home indicator or gesture bar.

### Server
- Job routes (`/job`):
  - `POST /create-job`
  - `GET /get-jobs`
  - `GET /get-tasks/:id` (job id; returns tasks sorted by `updatedAt` desc)
  - `POST /create-task/:id` (QR `punchId`; multipart)
- Seed test data with `npm run seed -- <email>` from `server/`. It runs `src/scripts/seed.ts` and creates 3 jobs with 10 tasks each for that user.
- Routes go `isAuth` → `fileParser` (multipart routes only) → `validate(schema)` → controller.
- Controllers check that the requested resource belongs to `req.user.id`, return errors with `sendErrorRes`, and return the created document in the response (`{ message, job }`, `{ message, task }`) so the client can update its state without fetching again.
- Uploads go through the shared `cloudinary` instance from `src/utils/cloudinary.ts`, following `updateAvatar`: check the mimetype, upload the `filepath`, and save `{ url: secure_url, id: public_id }` on the document. Images get a size transform (`crop: "limit"`). Videos need `resource_type: "video"`.

### Loading screens
- Screens that fetch data show a `Spinner` before the first load and support pull-to-refresh: a `RefreshControl` whose handler sets `loading`, awaits the fetch, then sets the data.
