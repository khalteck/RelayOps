# RelayOps accessibility review

RelayOps targets WCAG 2.2 AA. Automated checks complement, but do not replace, keyboard and assistive
technology review.

## Automated coverage

- Semantic contrast contracts cover both light and dark design tokens.
- React Testing Library and jest-axe cover shared states, forms, dialogs, and module-level views.
- Playwright and axe cover authenticated desktop and mobile routes.
- Keyboard tests cover navigation, actionable table rows, filters, modals, drawers, and focus return.

## Manual review checklist

- Use the skip link and complete every primary workflow without a pointer.
- Confirm focus enters dialogs and drawers, remains trapped, and returns to the trigger on close.
- Confirm table sorting, row opening, filters, pagination, and saved views have accessible names.
- Confirm validation errors are associated with their inputs and are not communicated by colour alone.
- Confirm loading, empty, failure, realtime, and notification states have meaningful announcements.
- Confirm headings form a useful hierarchy in every route.
- Confirm text and meaningful controls meet AA contrast in light and dark themes.
- Confirm content remains usable at 200% zoom and 320 CSS pixels without horizontal page scrolling.
- Confirm reduced-motion preference removes non-essential transitions.
- Review VoiceOver/Safari and NVDA/Firefox before the public deployment.

## Known boundaries

Automated browser checks cannot validate announcement timing or the quality of screen-reader wording.
Those remain explicit manual release checks. Chart summaries and empty states provide a textual
alternative to visual reporting data.
