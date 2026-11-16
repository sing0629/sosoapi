# Threads CLI versus browser benchmark

Use the same authorized Threads test account, exact text, model, reasoning effort, agent harness and provider-confirmed outcome. Compare the CLI `posts publish` path with the native browser composer. Record the exact CLI version and comparable starting context. Resolve credentials, account identity and permission before the warm runs. Count any handoff or wait that occurs during a run.

## New-user run

From a clean CLI environment, give the agent one prompt with an exact caption and the intended Threads handle. Start the timer with the prompt. Record each human handoff for tool approval, SosoAPI registration/sign-in, agent consent, Threads consent, account selection or post confirmation. Count distinct handoffs and keep the individual consent events visible. End when a confirmed Threads permalink is returned. Verify the exact account and text at that link.

## Warm pair

Use independent sessions with the original benchmark model and effort where available. Record the initial input-cache percentage in each arm. For comparison with a warm run, both must start at 90% or greater cached input. Keep other observations and label different conditions. Use the exact same approved caption inside a pair. Account selection, retries, ambiguous results and failed runs belong in the record.

For each arm capture:

- Wall-clock seconds from prompt to provider-confirmed link, including model/tool work and any human wait.
- Input tokens, cached input tokens and output tokens from the final accumulated usage once.
- Total tokens as input plus output. Uncached input as input minus cached input.
- Provider confirmation and exact-text verification. Keep test post IDs, screenshots and raw logs private.

Report the measurements with the cache condition and CLI version.

The [November 16 live result](../README.md#benchmark) records the completed same-model pair for `sosoapi@0.5.25`. Both sessions started with working authorization. The run captured final accumulated cache counts. Initial cache percentages were unavailable. Chrome's elapsed time includes the recorded browser-control relay queue.
