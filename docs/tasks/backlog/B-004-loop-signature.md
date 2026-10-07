# B-004 Loop createLoop signature: 3 params vs contract 2

Found during: T-007
Risk: low
Evidence: src/game/loop.ts — createLoop takes (dispatch, onFrame, getState) vs contract's (dispatch, onFrame)
Direction: Update T-007 contract to reflect the 3-param signature. The loop needs getState to pass state to onFrame.
State: resolved
