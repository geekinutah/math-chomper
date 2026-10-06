# B-008 Screens container blocks pointer events

Found during: T-012
Risk: low
Evidence: index.html — #screens div overlays canvas but lacks pointer-events: none when hidden
Direction: Add pointer-events: none to .screens[data-hidden="true"] or equivalent. Needed for Phase 6 touch controls.
State: resolved (index.html:24 sets pointer-events: none when hidden, Phase 6)
