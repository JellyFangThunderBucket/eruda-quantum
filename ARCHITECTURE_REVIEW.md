# Eruda Architecture Review

## Current architecture

Eruda exposes a single UMD entry point from `src/index.js`, which re-exports the singleton in `src/eruda.js`. Initialization creates the host container, optionally attaches a shadow root, injects shared styles through `evalCss`, creates `DevTools`, then creates the floating `EntryBtn`, settings, and the requested built-in tools.

Rendering is component-oriented but DOM-driven. Each tool extends `DevTools/Tool`, owns a root element inserted by `DevTools.add`, injects its SCSS at construction or initialization time, and renders either direct HTML fragments or a Luna UI widget. Shared class prefixing goes through `classPrefix` to keep Eruda styles isolated.

The plugin architecture is intentionally small: a plugin is a `Tool` instance or a function returning one. `DevTools.add` validates the tool name, creates the tab and tool pane, calls `tool.init($el, devTools)`, and then coordinates show/hide lifecycle through `showTool`. Public APIs are routed through the `eruda` singleton (`add`, `remove`, `show`, `hide`, `get`, `destroy`).

State management is mostly local to each tool. Persistent preferences use `Settings.createCfg`, which wraps `licia/LocalStore` with `eruda-*` keys. Runtime cross-component events use `src/lib/emitter.js` for global `ADD`, `SHOW`, and `SCALE` events, plus per-class `Emitter` instances for component-specific events.

The event flow starts at `eruda.init`: entry-button click toggles `DevTools`, tabs call `showTool`, settings changes update config stores and component setters, and tools subscribe to browser or Luna events as needed. Network inspection is driven by the bundled `chobitsu` protocol bridge, while console logging wraps browser console methods and the global uncaught-error listener.

The build process is webpack-based. `build/webpack.base.js` defines the UMD library output, Babel transpilation for source and Luna packages, SCSS/CSS processing, style prefixing/minification, dependency aliases, the dev server, and version/banner injection. Production, polyfill, analyzer, and dev configurations extend this base.

## Major modules

- `src/eruda.js`: public singleton, initialization sequence, container/shadow-DOM setup, built-in tool registration, scale/theme helpers, and teardown orchestration.
- `src/DevTools`: shell, tab strip, tool registry, settings integration, notifications/modals, resize behavior, safe-area and theme handling.
- `src/EntryBtn`: draggable floating launcher with persisted position and orientation/resize handling.
- `src/Console`: console override, log rendering, filters, JavaScript input, global error capture, copy helpers, and LunaConsole integration.
- `src/Elements`: DOM tree inspection, node selection, CSS detail panes, box model, and chobitsu-backed DOM/CSS interaction.
- `src/Network`: network recording, request table, detail viewer, copy-as-cURL, filtering opportunities, and responsive split/detail layout.
- `src/Resources`: local/session storage, cookies, scripts, stylesheets, iframes, images, and DOM mutation-driven refresh.
- `src/Sources`: source viewing and formatting around text-viewer behavior.
- `src/Snippets`: built-in snippets and snippet search/execution UI.
- `src/Info`: browser/device/page information panels.
- `src/Settings`: LunaSetting wrapper and persistent configuration controls.
- `src/lib`: shared CSS injection, global emitter, chobitsu bundle, logger, utility helpers, themes, and browser-safe fallbacks.
- `build`: webpack and post-build packaging scripts.
- `test`: browser/Karma fixtures and manual pages for built-in tools.

## Audit findings

1. Event-listener lifecycle is the highest-risk area. `EntryBtn` registered anonymous orientation and resize callbacks that could not be removed on destroy/re-init. `DevTools` did the same for system-theme changes. These are small leaks but matter on mobile pages that initialize/destroy Eruda repeatedly.
2. Touch responsiveness is generally good (`touch-action: none` on the entry button and pointer-event abstraction), but entry-button dragging updated layout synchronously on every pointer move. On low-end mobile browsers this can cause avoidable layout/style churn.
3. Some large modules (`Console`, `Network`, `Resources`, `Elements`) mix data collection, UI construction, event binding, and settings in one class. This is maintainable for the current size but raises the cost of larger features such as global search or richer filters.
4. Direct HTML string rendering is simple and compact, but repeated full-section `.html()` replacement in resources can do more DOM work than needed after frequent mutations. Existing throttling and config controls reduce the risk.
5. Backward compatibility requirements explain many older patterns (`licia/Class`, broad Babel target, shadow-root fallback, old iOS active workaround). These should not be removed without a support-policy decision.
6. Dependencies are primarily UI widgets and build tooling. No obviously unused runtime dependency was removed in this pass because many are imported by tool modules or webpack aliases.

## Highest-impact improvements

1. Make all long-lived browser/global subscriptions removable and verify teardown paths.
2. Batch hot pointer-move DOM writes with `requestAnimationFrame` for smoother mobile dragging and less main-thread pressure.
3. Add targeted features where Luna widgets already provide extension points: console search/filter improvements, network filtering, copy/export actions, and persistent display preferences.
4. Split future large-tool refactors by responsibility (state adapters, view rendering, event wiring) instead of wholesale rewrites.
5. Add regression tests or lightweight lifecycle tests for init/destroy/re-init, console override/restore, and network/resource cleanup.

## Risks

- Eruda supports embedding in arbitrary third-party pages; changes to event handling must preserve stop-propagation and touch behavior.
- Shadow DOM and non-shadow DOM modes have different CSS injection paths, so style changes need both modes checked.
- Chobitsu and Luna components are external integration points; refactors around them should be incremental.
- Mobile browser quirks are part of the product surface, so removing legacy compatibility code may break real users even when desktop tests pass.

## Recommended implementation plan

1. First address lifecycle leaks and mobile drag responsiveness with small, isolated changes.
2. Run lint/tests/build after the lifecycle patch.
3. Next add one user-facing feature at a time, starting with network filtering or console search because they fit existing control bars and persistent settings.
4. Refactor only the code touched by each feature, extracting helpers when duplication appears.
5. Document new APIs and settings as they are added.
