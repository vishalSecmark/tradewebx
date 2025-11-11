
# Website Accessibility — Comprehensive Checklist (WCAG 2.2 aligned)

**Purpose:** A practical checklist of main checkpoints to meet web accessibility criteria (WCAG 2.0/2.1/2.2). For each item there is a brief implementation note and quick testing tips.

---

## Principles (POUR)
1. **Perceivable** — Information and UI must be presented so users can perceive it.
2. **Operable** — Interface components and navigation must be operable.
3. **Understandable** — Information and operation of the UI must be understandable.
4. **Robust** — Content must be robust enough to be interpreted by a variety of user agents, including assistive technologies.

---

## Core Checklist (by feature / element)

### 1. Page structure & semantics
- **Use semantic HTML** (headings `<h1>`–`<h6>`, `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>`).  
  *Implementation:* Structure content with correct heading order (skip no levels). Use landmarks for main regions.  
  *Test:* Inspect DOM, use screen reader, check "list of headings".

- **Document language**: set `<html lang="en">`.  
  *Implementation:* Add `lang` attribute; change it when language changes inside page.  
  *Test:* Use validator or screen reader to confirm language.

### 2. Text alternatives
- **Images**: meaningful `alt` attribute for informative images; `alt=""` for decorative images.  
  *Implementation:* Content images: concise descriptive `alt`. Complex images: provide long description or link to full description.  
  *Test:* Turn off images or use a screen reader to verify.

- **Icons & SVGs**: provide accessible name via `aria-label`/`title` or `<title>` inside SVG when icon conveys meaning. Decorative SVGs should `aria-hidden="true"` or `focusable="false"`.  
  *Test:* Inspect accessible name in accessibility tree.

- **Multimedia**: captions for videos, transcripts for audio, and audio descriptions for essential visual information.  
  *Implementation:* Provide closed captions (SRT/VTT) and full transcript. For live audio/video, provide live captions where possible.  
  *Test:* Play media with captions; verify transcript readability.

### 3. Keyboard accessibility
- **Keyboard operable**: all functionality reachable and operable via keyboard (Tab, Enter, Space, Arrow keys as appropriate).  
  *Implementation:* Ensure custom controls handle `keydown`/`keyup` and `focus` states; avoid keyboard traps.  
  *Test:* Navigate entire site using keyboard only.

- **Focus visible**: visible focus indicator for interactive elements.  
  *Implementation:* Don't remove focus outline; style `:focus` with clear ring.  
  *Test:* Tab through controls; ensure focus is clearly visible.

- **Logical tab order**: DOM order should match visual order.  
  *Implementation:* Avoid heavy use of `tabindex` except `0` or `-1` where necessary; keep DOM structure logical.  
  *Test:* Tab navigation should follow reading order.

### 4. Color & Contrast
- **Color not sole means**: don't rely on color alone to convey information. Use text, icons, or patterns.  
  *Implementation:* Add text labels, icons, or ARIA to indicate states.  
  *Test:* View page in grayscale.

- **Contrast ratio**: text and images of text must meet contrast ratios — at least 4.5:1 for normal text (AA), 3:1 for large text (AA). Aim for 7:1 for AAA.  
  *Implementation:* Use color contrast tools during design; set CSS variables for colors and enforce via linting.  
  *Test:* Use automated color contrast tester.

### 5. Forms & Input Controls
- **Labels**: every input must have a visible `<label>` or accessible name (`aria-label` / `aria-labelledby`).  
  *Implementation:* Prefer `<label for="id">` associated with input. Group related inputs with `<fieldset>` and `<legend>`.  
  *Test:* Inspect accessible name and label association.

- **Error identification & suggestions**: On invalid input, indicate error and provide suggestions. Programmatically associate error messages (`aria-describedby`).  
  *Implementation:* Validate input, set `aria-invalid="true"` and point to error message id.  
  *Test:* Submit invalid data; ensure error is announced by screen reader and visible.

- **Instructions & placeholders**: do not rely on placeholder text as the only label. Use persistent labels.  
  *Implementation:* Keep placeholders for hint only; label should be visible.

### 6. Links & Buttons
- **Descriptive link text**: link text should describe destination/purpose (avoid "click here").  
  *Implementation:* Use full descriptive text; add `title` only if necessary (but don't rely on it).  
  *Test:* Use list of links view in screen reader.

- **Buttons vs links**: use `<button>` for actions and `<a>` for navigation with `href`.  
  *Implementation:* Ensure role semantics are correct.

### 7. Headings & Content Order
- **Correct heading hierarchy** and informative headings.  
  *Implementation:* Use headings to convey structure, not for visual styling.

### 8. Animations & Motion
- **Reduce motion option**: respect `prefers-reduced-motion`. Provide controls to pause/stop non-essential animations.  
  *Implementation:* CSS `@media (prefers-reduced-motion: reduce)` and `animation-play-state`.  
  *Test:* Toggle system reduced motion setting; ensure animations are reduced.

- **No content that flashes**: avoid flashes >3 times per second (seizure risk).  
  *Test:* Audit animations.

### 9. Timed Content
- **Time limits**: provide ways to extend or disable time limits.  
  *Implementation:* Provide controls to request more time or a setting to disable timeouts.  
  *Test:* Simulate timeout and verify option to extend.

### 10. Dynamic content & ARIA
- **Use ARIA appropriately**: only when native HTML doesn't suffice. Keep ARIA roles/states updated.  
  *Implementation:* Follow WAI-ARIA Authoring Practices. Update `aria-expanded`, `aria-selected`, `aria-live` regions for dynamic updates.  
  *Test:* Use accessibility tree and screen reader to confirm states are announced.

- **Live regions**: use `aria-live="polite"` or `"assertive"` for updates; keep messages concise.  
  *Test:* Trigger dynamic content and listen with screen reader.

### 11. Tables & Data
- **Tables for data, not layout**. Use `<th>` for headers and `scope` or `id/headers`.  
  *Implementation:* Provide summaries or captions when helpful.  
  *Test:* Navigate table with screen reader; verify header reading.

### 12. Complex Widgets (menus, dialogs, modals)
- **Keyboard & ARIA behavior**: dialogs should trap focus, have `role="dialog"` and `aria-modal="true"`, and be announced to screen readers.  
  *Implementation:* Focus should move into dialog on open and return to trigger on close.  
  *Test:* Open dialog with keyboard; ensure focus handling and announcement.

- **Custom widgets**: implement ARIA roles and keyboard patterns per APG (combobox, menu, tabs, tree).  
  *Test:* Test with screen readers and keyboard.

### 13. PDF & Documents
- **Accessible documents**: tagged PDF, proper reading order, headings, alt text, language, and searchable text.  
  *Implementation:* Export from authoring tool with accessibility tags, set document language, provide accessible metadata.  
  *Test:* Use Acrobat accessibility checker or similar tools.

### 14. Media players
- **Controls accessible**: keyboard operable, labelled controls, captions, transcripts.  
  *Implementation:* Ensure play/pause/seek are accessible via keyboard and screen reader.  
  *Test:* Operate player with keyboard and screen reader.

### 15. Internationalization
- **Change language**: use `lang` attribute per content region and proper encoding (UTF-8).  
  *Test:* Screen readers should switch pronunciation based on `lang`.

### 16. Robustness & Code Quality
- **Valid HTML**: minimize parse errors. Use W3C validators.  
  *Implementation:* Lint HTML/CSS/JS in CI.  
  *Test:* Run validators; check for ARIA misuse.

### 17. Accessibility in Development Workflow
- **Automated tests**: integrate linters and tools (axe-core, pa11y, Lighthouse) into CI.  
  *Implementation:* Run checks on pull requests; fail builds for regressions.  
  *Test:* CI reports.

- **Manual testing**: keyboard-only, screen readers (NVDA, VoiceOver, JAWS), color-blindness simulation, mobile testing.  
  *Implementation:* Add accessibility testing steps in QA checklist.

- **User testing**: include people with disabilities in usability testing.

---

## Testing & Tools (suggested)
- **Automated:** axe-core (browser extension / npm), Lighthouse, WAVE, pa11y, HTML validator, contrast checkers.  
- **Manual:** NVDA (Windows), VoiceOver (macOS/iOS), TalkBack (Android), keyboard navigation, color-blindness simulators.  
- **Authoritative references:** W3C WCAG 2.2 Quick Reference, WAI-ARIA APG, WCAG Techniques.

---

## Implementation patterns & snippets (examples)
- **Image alt**
```html
<img src="/team.jpg" alt="Team photo at the 2025 conference">
```
- **Label + input**
```html
<label for="email">Email address</label>
<input id="email" name="email" type="email" />
```
- **Accessible button**
```html
<button type="button" aria-pressed="false">Toggle</button>
```
- **Skip link**
```html
<a class="skip-link" href="#main">Skip to main content</a>
```
- **Keyboard focus style (CSS)**
```css
:focus {
  outline: 3px solid Highlight;
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

## Quick Acceptance Checklist (summary — short)
- Semantic HTML & landmarks ✔
- Proper `lang` ✔
- Alt text for images ✔
- Captions/transcripts for media ✔
- Keyboard accessible ✔
- Visible focus ✔
- Sufficient color contrast ✔
- Form labels & error messages ✔
- No keyboard traps; logical tab order ✔
- ARIA used correctly for custom widgets ✔
- Accessible dialogs & live regions ✔
- Accessible documents (PDF) ✔
- Automated + manual testing included in workflow ✔

---

## References
- W3C — WCAG 2.2 Quick Reference & Techniques.  
- W3C — WCAG 2.2 Understanding.  
- W3C — ARIA Authoring Practices Guide (APG).  
- WebAIM — WCAG checklist and testing resources.  
(See embedded links in the full report or use official W3C resources.)

---

*If you want, I can now generate a single downloadable PDF and/or Word document with this checklist and expanded implementation examples for specific widgets (e.g., accessible modal, dropdown, combobox) — I created markdown and text files that you can download below and convert to PDF/Word using Word/Google Docs or a Markdown-to-PDF tool.*
