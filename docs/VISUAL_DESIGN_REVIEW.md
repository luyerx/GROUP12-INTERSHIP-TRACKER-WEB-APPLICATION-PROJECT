# Homepage and career-platform visual pass

Reviewed 7 October 2026 (Pacific/Auckland).

## Direction

Warm off-white, restrained teal, muted sage surfaces, editorial serif accents and a clear sans-serif workspace hierarchy. Borders, typography and varied spacing provide structure; imagery is original local SVG and HTML product previews. No remote image/font dependency, new library, framework upgrade, animation framework or generated photography.

## Public homepage

`/` now renders a complete public landing page instead of redirecting to `/login`:

1. Sticky navigation, mobile disclosure menu, Sign In and Get Started.
2. Split hero with career illustration and application workspace preview.
3. Product story with application board and three explanations.
4. Discover / Track / Prepare / Progress workflow.
5. AI Career Hub preview and five-tool directory.
6. Three clearly labelled illustrative opportunity examples.
7. Career Resources editorial section.
8. Distinct student and employer panels.
9. Final account CTA and footer.

Existing authenticated users stay on `/`; the navigation reads the existing session endpoint and offers the dashboard for their role. Login/register remain at their existing paths. Protected student destinations retain their original guards. Homepage examples are not live vacancies or real organisations; the public page does not bypass opportunity-discovery permissions to query the database.

## Workspace changes

| Area | Presentation changes |
| --- | --- |
| Shared workspace | Warm background, quiet sidebar, stronger page titles, compact metrics, lighter borders, consistent focus styling |
| Login / Register | Existing split layout retained; forest-teal statement panel, local board preview, home link; forms and role choices unchanged |
| Student Dashboard | Career illustration and preparation entry, retained real next actions/stats, compact metrics, recent-application table becomes labelled mobile cards |
| Employee Dashboard | Distinct employer introduction with local artwork; existing listing statistics, publishing checklist and profile links retained |
| Opportunities | Desktop filter rail, collapsible mobile filters, compact recruitment list; all existing filtering and discovery unchanged |
| Opportunity detail | Clear company/role header and metadata surface; original tracking and employer-link actions retained |
| My Applications | Table hierarchy and read-only next-step copy based on current status; mobile cards and existing Board retained |
| Application detail | Current-stage strip explicitly labelled as not historical; original snapshot, progress, status update, notes and actions retained |
| Calendar | Grouped month/today/event controls and shared surface refinement; month grid and upcoming-panel logic unchanged |
| Resources | Featured editorial cover, original book artwork, miniature document thumbnails and existing real category grouping |
| AI Career Hub | Vertical tool selector on desktop, compact selector on mobile, active workspace with results/history/usage together; contextual loading retained |
| Profile | Career-focused heading and shared form/typography refinement |
| Admin | Compact operations styling; opportunity management table; consistent headers/hover treatment for existing users/resources/usage tables |

Empty states retain existing meaningful explanations and actions. Shared empty states get a small quiet visual treatment. AI History gains an explanation and a link back to its workspace. Application and opportunity empty-state recovery actions are retained.

## Components and assets

- `components/marketing/PublicNavigation.tsx`: session-aware public links and mobile disclosure.
- `components/marketing/ProductPreview.tsx`: explicitly illustrative tracker, board and interview-preparation previews.
- `components/visual/CareerIllustration.tsx`: original inline SVG journey, employer and reading-room variants; decorative artwork is hidden from assistive technology.
- `app/editorial.css`: global visual refinements and scoped marketing/workspace layouts, imported by the existing root layout.

There are no external image URLs, licensed stock assets or new package dependencies. Previews contain illustrative content only; they are not interactive fake product controls.

## Responsive and browser review

The optional `scripts/test-visual-review.mjs` runs through the existing isolated-database workflow with `RUN_VISUAL_TESTS=1`, `PLAYWRIGHT_MODULE` and optional `VISUAL_SCREENSHOTS_DIR`. It uses real test sessions and read-only browser fixtures for populated opportunities/resources, never production/demo database writes.

Twenty pages are captured at 1440, 1024 and 390 pixels: Homepage, Login, Register, Student Dashboard, Opportunities, Opportunity Detail, Applications, Application Detail, Calendar, AI Career Hub, Resources, Profile, Employee Dashboard, Employee Opportunities, Company Profile, Admin Dashboard, Users, Opportunities, Resources and AI Usage. It also checks mobile navigation, signed-in homepage role links, filtering/empty-state recovery, collapsed filters and populated admin tables.

Screenshots were visually inspected for composition, typography, stacking and spacing, including the requested six priority pages on desktop/mobile. Review caught and fixed a board-preview class-name collision and a utility-class override in opportunity lists. The browser suite now asserts full-width board-preview content to guard the collision. Tables requiring more horizontal room scroll inside their own region rather than widening the page; the existing mobile month-grid scroll behavior remains.

The extended existing workspace UI test freezes browser dates for Auckland/DST assertions. Its harness now first hydrates a neutral page with the real server clock, then enters Dashboard through client navigation with simulated dates. This avoids artificial server/browser date-text hydration mismatches; all original timezone assertions are preserved and no production date logic changes.

## Protected scope

No changes under `app/api/` or `lib/`. Auth/roles/permissions, AI models/timeouts/retries/schemas/safety, History and monthly usage, Admin usage aggregation, discovery/ownership, application snapshots/transactions, Pacific/Auckland dates, notifications, password recovery and database schemas are unchanged. The new Next Step column and current-stage strip only display existing status. No live Gemini call, real email, seed, deployment, commit or push.

## Limitations

The homepage uses labelled neutral examples because published opportunities remain protected. The artwork is illustrative rather than photography. Visual testing uses Chrome and controlled fixture content; it cannot exhaust every real content length or browser. Narrow admin tables and the calendar intentionally retain internal horizontal scrolling. Shared styling also refines existing forms without rewriting their field structure.

## Final validation

| Check | Result |
| --- | --- |
| git diff --check | Passed |
| npm run lint | Passed |
| npm run build | Passed, including TypeScript |
| node scripts/test-ai.mjs | 484 assertions, unchanged count |
| npm run test:workflow | 143 workflow assertions + 14 AI HTTP/session/database assertions |
| AI browser suite | 44 assertions |
| Existing workspace browser suite | 122 assertions; all original checks retained |
| New visual/browser suite | 140 assertions; 20 pages at three widths, 78 screenshots including priority-page viewport captures |
| node scripts/test-feature-freeze.mjs | 95 assertions |
| node scripts/test-acceptance.mjs | 40 frontend assertions plus its 48 Admin assertions |
| node scripts/test-admin-regression.mjs | 48 assertions, also run separately |

The final expanded workflow exits successfully and removes its isolated database. The earlier browser-clock harness failure was corrected and rerun successfully, without suppressing browser errors or removing assertions. No page overflow was detected at any of the three target widths.
