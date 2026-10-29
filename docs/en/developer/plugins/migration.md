# Moving to the async subsystem

**Status:** Proposed plan.

The migration replaces v0.1 execution with the v0.2 async architecture. During that transition, the server still needs to run existing components according to their documented behavior and report unsupported combinations clearly.

## What changes for a plugin

In the target runtime, another eligible invocation can make progress while a handler awaits. Plugin state can therefore change between the beginning and end of an async operation. Authors need to account for that interleaving rather than assume that a suspended handler excludes every other callback.

Resources also have explicit ownership and operation lifetimes. Retaining a handle does not extend a completed event decision's mutation window. Event facts and permitted changes become separate parts of the API.

Migration material should distinguish three cases: an existing binary still runs, rebuilding with a new SDK is sufficient, or the plugin needs source changes. A failure to activate should identify the missing interface or unsupported execution requirement rather than reporting only a generic ABI mismatch.

## Establishing the replacement

The replacement consists of the host, guest bindings, SDKs, build instructions, and tested execution behavior. A WIT declaration alone guarantees none of that execution behavior.

Coverage includes commands and suggestions, scheduled tasks, lifecycle callbacks, IPC or typed component calls, AI hooks, and generation as well as events. Supported guest toolchains must produce components that actually exercise the intended suspension and callback behavior.

Invocation identity and resource cleanup are prerequisites for relaxing independent-root admission. Mixed-generation calls preserve their causal relationship while the old execution path remains present.

## Moving gameplay callers

An async guest can still have a synchronous gameplay caller waiting on it. That caller becomes parkable only when the surrounding operation can release its state access, await the decision, and validate commit afterward. The migration introduces that boundary only where ownership can be enforced.

Remaining synchronous bridges stay identifiable and have explicit deadline and failure behavior. They are transitional even after the guest ABI is async. Region integration and generic library linking are related tracks with different prerequisites; neither has to wait for the other's application-specific features.

## Removing v0.1

Removal becomes possible when the new host covers the supported callback and operation surface, released SDKs can produce usable components, and replacement behavior is documented. Overload, interruption, lifecycle, compatibility, and gameplay tests must exercise the new path.

The project then announces the removal one release ahead, following the release window in [versioning](./versioning#deprecation-and-support). Code used solely by v0.1 can be removed: bindings, engine-specific configuration, admission and pumping adapters, dispatch branches, and legacy-only fixtures.

Historical migration notes and clear unsupported-version diagnostics remain useful after removal. Shared utilities remain only where the async architecture still uses them.
