# Testing the plugin runtime

**Status:** Proposed gates. Existing tests cover selected store and scheduler behavior; the integrated architecture has not passed them.

A runtime change needs evidence at the boundary it affects. A queue test can establish admission behavior; a component test can establish a generated calling convention; a server workload can establish its effect on gameplay latency. These are different questions even when they exercise related code.

## Running the existing suites

From the Pumpkin server repository, run the runtime and domain scheduler suites:

```sh
cargo test --locked -p pumpkin-plugin-runtime
cargo test --locked -p pumpkin-scheduler
```

The inspected host keeps its v0.2 path behind a feature. Include that feature when checking its tests:

```sh
cargo test --locked -p pumpkin-wasm-host --features v0_2
```

These commands run the existing tests only. They do not cover the missing domain integration or show that every v0.2 callback is exercised. They apply to the source revision pinned in the [implementation status](./implementation-status).

## Matching a test to a claim

| Level | What it establishes |
| --- | --- |
| Source inspection | A code path or contract exists at a named revision |
| Mechanism experiment | An isolated policy or data structure behaves as measured |
| Component test | Actual Wasm and generated bindings exercise a host boundary |
| Server integration test | Real dispatch and gameplay ownership paths behave correctly |
| Workload measurement | A specified server configuration achieves measured latency, capacity, or resource use |

An admission experiment awaiting timers demonstrates queueing behavior. It does not measure Wasm execution or server throughput. A resource-table sequence demonstrates a reuse mechanism; an in-situ defect still needs a real component reproducer. Rebuilding a fixture with a new SDK does not prove compatibility with an old binary.

## Exercising boundaries

| Area | Required scenarios |
| --- | --- |
| Invocation context | Independent roots in one store; nested component calls; explicit task hops; correct attribution of imports |
| Progress | Opposing roots; same-instance callbacks; cross-domain callbacks; saturated admission; bounded recursion/dependency failure |
| Resources | Own and borrow; early drop; retained handle; stale generation; provider failure; cleanup errors; repeated slot reuse |
| Events | No handlers; ordering; earlier edits; immutable facts; invalid edits; expiry; late reply; client correction where required |
| Lifecycle | Partial activation failure; failed dependency; new calls during retirement; accepted work draining; outstanding resources; native code residency |
| Fault containment | Tight guest loop; excessive host calls; memory growth; dropped waiter; deadline expiry; store interruption; host I/O completing late |
| Domains | Same-owner progress; independent owners; ownership transfer; stale requests; revalidation before commit; cross-owner failure |
| Compatibility | Released binaries; supported SDK languages; execution features; incompatible interfaces; feature-on and feature-off diagnostics |

CPU interruption, deadline settlement, and authoritative effect prevention require separate assertions. Include guest-private state in callback tests so a second instance cannot accidentally satisfy a same-instance scenario.

## Measuring a server workload

Compare against a plugin-free baseline, using a small representative plugin set and workloads that stress contention (independent I/O waits, decision callbacks, extension calls, repeating tasks) and failure. A single crowded region and several unrelated active regions answer different scalability questions.

Record decision latency distributions, admitted and rejected work, queue age, execution versus wait time, host calls, copied bytes, retained resources, and effects on unrelated gameplay. Treat owner commit rejection and client correction as correctness outcomes, not only timing statistics.

When comparing event representations (value events, resource access, typed field methods, snapshots, grouped updates), hold the semantics identical ([ADR 0003](./decisions/0003-event-decisions)) and count Wasm boundary crossings, since a faster queue does not mean fewer of them.

## Compatibility coverage

Run WIT/binding validation, feature-enabled v0.2 tests, relevant runtime/domain suites, and released-component compatibility fixtures. Include malformed or unsupported imports and resource mismatches. Render documentation diagrams and check internal links.

A new architecture claim should identify which evidence level establishes it. A unit test cannot establish region isolation; a domain enum cannot establish state ownership; a timeout cannot establish guest termination. Gameplay-visible behavior also requires the project's prescribed client validation.
