# 0001: Target one async execution architecture

**Status:** Proposed. **Date:** 2026-10-28.

## Context

The v0.1 sequential driver and the v0.2 concurrent stores share one legacy admission policy, which couples unrelated roots. Keeping both generations would keep that coupling.

## Decision

Target a single invocation architecture built around supported stackless async components. Keep v0.1 admission and callback pumping as removable migration adapters.

Store driving and authoritative gameplay ownership remain separate responsibilities. Existing synchronous gameplay bridges are transitional even after the guest ABI becomes async.

**Calling conventions:** A v0.2 component's async exports must use the stackless (callback) form of the component-model async ABI. Support is defined by calling convention, not by WIT package version label. A toolchain joins the supported list once the components it generates pass the callback, reentry, and saturation tests in [validation](../validation), and each release's contract matrix ([ADR 0005](./0005-contract-versioning)) names it.

**Synchronous implementations:** A component that implements an async export synchronously is rejected at activation. The diagnostic names the interface and the unsupported execution requirement. Such a component is not run on the legacy lane.

**Support window:** v0.1 follows the release-window rule in ADR 0005: it stays supported until two server releases after the first release whose SDKs cover every supported language, and the release before removal announces it. The window is counted in releases, not calendar dates.

**Native plugins:** Native plugins stay supported as trusted in-process code. The subsystem gives them no isolation, interruption, or ownership-enforcement guarantee. The host guarantees only that their code stays loaded while any callback, task, service, or destructor can still run it. A plugin that needs stronger limits ships as Wasm.

## Alternatives

Retaining both execution generations permanently preserves more old binaries but also retains compatibility-specific admission and lifecycle complexity. Removing legacy admission immediately would break unsupported nested-call paths before context and progress guarantees exist. Neither works as an unqualified migration strategy.

## Consequences

SDKs, callback coverage, compatibility diagnostics, and actual component tests become removal prerequisites. Components built with a synchronous toolchain must be rebuilt with a supported one before they can use v0.2 interfaces.

See [execution](../execution) and [migration](../migration).
