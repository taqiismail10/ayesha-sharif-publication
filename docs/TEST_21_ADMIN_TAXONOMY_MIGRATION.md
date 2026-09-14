# Test 21/45 — Admin Category & Tag Management Migration

## Overall Status

⚠️ PARTIAL — taxonomy ownership migration and local functional verification pass.
Repository-wide lint/type/build/whitespace gates have unrelated blockers.
This is not a declaration that the whole admin migration is complete.

## Before

Admin UI → Next.js server actions / direct Prisma → Category / Tag / BookTag.

### Audit of original behavior

All listed operations require super_admin, admin or editor.

| Operation | Current function before migration | Validation | DB operations |
| --- | --- | --- | --- |
| List categories | AdminCategoriesPage | requireAdmin roles | category.findMany, name ascending, books count |
| Create category | createCategoryAction | trimmed name ≥2; trimmed ASCII slug ≥2; optional trimmed description | category.create, always active |
| Update category | updateCategoryAction | same fields; submitted slug required; checkbox boolean | category.update |
| Archive category | archiveCategoryAction | role check, string ID | category.update isActive=false |
| Reactivate category | updateCategoryAction | Active checkbox | category.update isActive=true |
| Delete category | None | Not supported | None |
| List tags | AdminTagsPage | requireAdmin roles | tag.findMany, name ascending, join count |
| Create tag | createTagAction | trimmed name ≥2; trimmed ASCII slug ≥2 | tag.create, always active |
| Update tag | updateTagAction | same fields; submitted slug required; checkbox boolean | tag.update |
| Archive tag | archiveTagAction | role check, string ID | tag.update isActive=false |
| Reactivate tag | updateTagAction | Active checkbox | tag.update isActive=true |
| Delete tag | None | Not supported | None |

## After

Admin UI → thin Next.js transport/cache server actions → NestJS admin API →
AdminGuard → AdminRolesGuard → AdminTaxonomyService → PrismaD1 → D1.

Listing pages call the API through the existing server-side adminApi cookie
forwarder. Next.js retains rendering, form transport, navigation and cache
invalidation, but no taxonomy authorization policy, authoritative validation,
slug generation or database writes in the mutation adapters.

## Migrated Endpoints

| Endpoint | Purpose | Roles | Status |
| --- | --- | --- | --- |
| GET /admin/categories | List and inline edit data, book counts | super_admin/admin/editor | Local PASS |
| POST /admin/categories | Create | super_admin/admin/editor | Local PASS |
| PUT /admin/categories/:id | Update, including reactivation | super_admin/admin/editor | Local PASS |
| PATCH /admin/categories/:id/archive | Archive | super_admin/admin/editor | Local PASS |
| GET /admin/tags | List and inline edit data, join counts | super_admin/admin/editor | Local PASS |
| POST /admin/tags | Create | super_admin/admin/editor | Local PASS |
| PUT /admin/tags/:id | Update, including reactivation | super_admin/admin/editor | Local PASS |
| PATCH /admin/tags/:id/archive | Archive | super_admin/admin/editor | Local PASS |

No unused detail, delete or separate unarchive endpoints were added. Existing
inline forms obtain their edit data from list responses.

## Category Business Rules

- Uniqueness: only slug is unique. Duplicate names with different slugs remain
  allowed. No new name uniqueness or length cap was invented.
- Slug behavior: manual ASCII slug, or lowercase ASCII generation on creation
  when blank/missing. Updates use the supplied slug; renaming with the original
  slug keeps it stable. Slugs can be explicitly changed.
- Examples: Science Fiction → science-fiction; padded History → history.
  বাংলা সাহিত্য requires a manual ASCII slug, as before.
- Description: trimmed; empty string clears it. Omission remains optional.
- Archive: active=false, retains books; the Active checkbox reactivates.
- Delete: absent in product/API. DELETE returns 404.
- Book relationship: Book.categoryId remains unchanged on archive/rename.
  Schema-level physical deletion uses SET NULL, verified on disposable local
  fixtures only. No category-delete API was introduced.
- Listing: includes inactive entries and counts, ordered by name ascending.
  There is no existing taxonomy search/contains endpoint to migrate.

## Tag Business Rules

Same name, slug and active rules as categories; no description field.
Archiving/renaming retains BookTag rows. BookTag has a composite primary key
(bookId, tagId), preventing duplicate assignments. Physical schema-level tag
deletion cascades join rows; product/API deletion is absent.

## Authorization Matrix

Runtime checks use real guards and randomly generated local AdminSession
fixtures. No production guard overrides were used.

| Action | super_admin | admin | editor | order_manager |
| --- | --- | --- | --- | --- |
| List categories | Allow | Allow | Allow | 403 |
| Create category | Allow | Allow | Allow | 403 |
| Update category | Allow | Allow | Allow | 403 |
| Archive category | Allow | Allow | Allow | 403 |
| List tags | Allow | Allow | Allow | 403 |
| Create tag | Allow | Allow | Allow | 403 |
| Update tag | Allow | Allow | Allow | 403 |
| Archive tag | Allow | Allow | Allow | 403 |

Unauthenticated and customer-cookie-only requests receive 401 for every route.
Body role/adminId fields do not grant authority. Zod strips unknown fields.
Malformed IDs receive 400; well-formed missing IDs receive 404.
Browser order_manager navigation redirects to /admin/unauthorized.

## D1 Integrity

- Unique constraints: duplicate slugs return safe 409 through the existing
  PrismaExceptionFilter, for create and update.
- Concurrent duplicate test: two simultaneous creates for Fiction produce one
  201, one 409, and exactly one row, for each taxonomy.
- Foreign keys: PRAGMA foreign_key_check returned no violations. Invalid tag
  joins fail. Category SET NULL and tag cascade were tested locally.
- BookTag consistency: duplicate joins fail; archive/rename/reactivation retain
  existing relations and counts.
- PrismaD1: exercised using actual local D1 through Wrangler getPlatformProxy,
  with remoteBindings:false and persist:false. No DB mocks.
- Case behavior: names are not unique; permitted slugs contain lowercase ASCII
  only. No PostgreSQL insensitive-search mode was added.
- Dates/boolean fields: Prisma creates timestamps and round-trips active flags.
- HTTP host: compiled NestJS on Node with the local D1 adapter. A test-only
  loader adapts the Cloudflare generated compiler WASM import for Node.
  This does not constitute a deployed Worker smoke test.

## Frontend Migration

Switched:
- src/app/admin/(protected)/categories/page.tsx
- src/app/admin/(protected)/tags/page.tsx
- src/app/admin/(protected)/books/new/page.tsx — taxonomy options only
- src/app/admin/(protected)/books/[id]/edit/page.tsx — taxonomy options only

Preserved inline forms, archive controls, active checkbox, counts, sorting,
navigation and public catalogue cache invalidation. Added accessible names to
taxonomy text inputs without a visual redesign. AdminBookForm now types option
items by the id/name fields it actually needs.

## Removed Next.js Logic

Removed original createCategoryAction, updateCategoryAction,
archiveCategoryAction, createTagAction, updateTagAction and archiveTagAction
from src/app/admin/actions.ts after API parity and browser form checks.

Removed six taxonomy mutation queries, both taxonomy-page Prisma list queries,
and four category/tag option queries from book new/edit pages.
Removed the now-unused categoryFormSchema and tagFormSchema from validators.ts.

Replacement names in taxonomy-actions.ts are transport/cache adapters only.

## Remaining Next.js Taxonomy Logic

Static source search after removal:

| Reference | Classification | Reason |
| --- | --- | --- |
| src/app/admin/taxonomy-actions.ts: create/update/archive functions | INTENTIONALLY RETAINED | Thin HTTP/cache transport |
| Category/tag page imports, form actions and update bindings | INTENTIONALLY RETAINED | UI callers of transport adapters |
| src/lib/admin-taxonomy.ts | INTENTIONALLY RETAINED | Typed API read helper |
| src/lib/data.ts:131,217,221 | PUBLIC READ | Public catalogue reads, out of scope |
| src/app/(site)/account/settings/page.tsx:16,21 | INTENTIONALLY RETAINED | Customer preference options, out of scope |
| apps/api/src/admin/admin-taxonomy.service.ts | NESTJS | Authoritative taxonomy reads/writes |
| apps/api/test/taxonomy.local.cjs | INTENTIONALLY RETAINED | Isolated local test fixtures/assertions |

No obsolete taxonomy runtime callers remain in admin/actions.ts. No direct
prisma.category, prisma.tag or prisma.bookTag calls remain under admin
categories/tags pages or the book new/edit option readers. Historical docs
are evidence, not runtime callers. Public reads and customer code remain
intentionally outside this ownership migration.

## Runtime Tests

Final command: cd apps/api && node test/taxonomy.local.cjs
Result: exit 0, 97 passing assertions.

| Test | Expected | Actual | Status |
| --- | --- | --- | --- |
| Unauthenticated / customer-only, all taxonomy routes | 401 | 401 | PASS |
| Order manager, all taxonomy routes, role spoof payloads | 403 | 403 | PASS |
| super_admin/admin/editor list/create/update/archive | Allowed | Allowed | PASS |
| Empty, whitespace, one-character names | 400 | 400 | PASS |
| Bengali automatic/manual slug | 400 / 201 | 400 / 201 | PASS |
| 1000-character name with valid slug | Allowed under old rule | 201 | PASS |
| Duplicate slug create/update | 409 | 409 | PASS |
| Duplicate name, different slug | Allowed | 201 | PASS |
| Simultaneous duplicate create | 201 + 409, one row | Matches | PASS |
| Malformed/missing ID | 400 / 404 | 400 / 404 | PASS |
| Description trim/clear | Trimmed / empty | Matches | PASS |
| Rename/archive/reactivation with referenced books | Relations preserved | Matches | PASS |
| Duplicate join / missing FK | Reject | Rejected | PASS |
| Physical schema FK probes | SET NULL / cascade | Matches | PASS |
| Delete HTTP method | No endpoint | 404 | PASS |
| Browser category/tag create, rename, archive, reactivate | Working forms | Both passed | PASS |
| Book new/edit option lists and selections | Loaded/preserved | Both passed | PASS |
| Keyboard Tab from name | Slug field | Slug field | PASS |
| Mobile 390px viewport | No page-level horizontal overflow | None | PASS |
| Browser role denial | Unauthorized page | Correct redirect | PASS |

Browser tests used a separate frontend process with process-only API URLs
pointing to localhost:8790. No environment file was changed for Test 21.
A test-only session helper exists only in the local harness with --serve;
it is never registered in the application module or Worker.

## Book Integration Regression

Book create and edit pages both returned 200 with populated category/tag
options. Edit retained the fixture category and one checked tag. Existing
NestJS book detail returned the same relationships after taxonomy mutations.
No book endpoint redesign, stock change, upload or order mutation was made.

## Findings

### TAXONOMY-001
Severity: Medium — existing, out of scope.
Finding: retained Next.js admin dashboard directly instantiates the PostgreSQL
Prisma adapter against the SQLite schema.
Evidence: /admin rendering during testing logged PrismaClientInitializationError
at src/lib/prisma.ts:20, called by the admin dashboard at page.tsx:37.
Recommendation: migrate remaining admin database ownership before claiming
the whole admin experience is D1-compatible. Do not change providers.

### TAXONOMY-002
Severity: Low — existing validation/product limitation.
Finding: no explicit name-length cap and ASCII-only generated slugs.
Evidence: 1000-character name is accepted; Bengali-only automatic slug fails.
Recommendation: preserve parity here; any new length/transliteration policy
should be a separate product decision.

### TAXONOMY-003
Severity: Medium — repository verification limitation.
Finding: global checks are not green due to unrelated generated/retained code.
Evidence: results below. Changed-file lint passes.
Recommendation: address global lint exclusions and retained schema/type
compatibility separately; do not suppress errors in this migration.

## Build Results

| Exact command | Result |
| --- | --- |
| cd apps/api; npm run prisma:generate | PASS, Prisma 7.10.0 |
| cd apps/api; npm run lint | PASS, 0 errors / 3 existing warnings |
| cd apps/api; npm run build | PASS, before and after frontend migration |
| cd apps/api; node test/taxonomy.local.cjs | PASS, 97 assertions |
| npm run lint | FAIL, 252 errors / 1656 warnings; generated Wrangler bundles included |
| npx eslint [changed TypeScript/TSX and harness files] | PASS |
| npx tsc --noEmit | FAIL, existing seed/public/customer/admin schema-type errors; includes existing galleryImages typing in book form |
| npm run build | BLOCKED: five next/font Google Fonts fetch failures |
| git diff --check | FAIL only on pre-existing app.module.ts trailing whitespace and worker.ts EOF blank line |
| git diff --check -- [Test 21 tracked files] | PASS |

The frontend build failed fetching Anek Bangla, Crimson Text, Inter,
Montserrat and Noto Serif Bengali. Fonts were not changed.
Pre-existing uncommitted backend/mail/Worker changes were preserved.

## Files Modified

Added:
- apps/api/src/admin/admin-categories.controller.ts
- apps/api/src/admin/admin-tags.controller.ts
- apps/api/src/admin/admin-taxonomy.service.ts
- apps/api/test/taxonomy.local.cjs
- src/app/admin/taxonomy-actions.ts
- src/lib/admin-taxonomy.ts
- docs/TEST_21_ADMIN_TAXONOMY_MIGRATION.md

Updated:
- apps/api/src/admin/admin.module.ts
- src/app/admin/actions.ts
- category/tag pages and book new/edit pages listed above
- src/components/admin/admin-book-form.tsx
- src/lib/validators.ts

No production dependencies, schema/provider changes or remote migrations.

## Remote Safety

These statements apply to Test 21; prior customer-auth testing is separate.

REMOTE WORKER DEPLOYED: NO
REMOTE D1 MODIFIED: NO

## Next Recommended Test

Test 22/45 — Remaining Admin D1 Compatibility and Ownership Audit:
prioritize the confirmed dashboard adapter failure and retained book-delete
Prisma action before expanding to CMS/settings/policies. Do not execute this
next test as part of Test 21.

## Test 21 Conclusion

Category/tag admin backend ownership is now exclusively NestJS. Next.js retains
UI and API/cache adapters, not taxonomy database or business logic. Local API,
D1 integrity and browser flow checks pass; global repository gates prevent an
unqualified overall PASS.

TEST 21/45 COMPLETE.

