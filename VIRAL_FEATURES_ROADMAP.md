# Viral Features Roadmap

Future features to increase sharing, engagement, and signups.

---

## Medium Priority

### 1. Shareable Image Cards
Generate beautiful OG/social images showing someone's list for social media sharing.

**What it does:**
- Creates a visual card with top 5 posters + username
- Looks great when shared on Twitter/Instagram
- More compelling than a plain link

**Implementation:**
- Use Vercel OG or similar for dynamic image generation
- Create `/api/og/list/[id]` endpoint
- Include top item posters, list name, username, item count

**Files to modify:**
- Create `app/api/og/list/[id]/route.tsx`
- Update `generateMetadata` to include og:image

---

### 2. Comparison Links
Side-by-side comparison URLs like `/compare/alice/bob/horror-movies`.

**What it does:**
- Shows two users' rankings side by side
- Highlights agreements and disagreements
- "See where we agree and disagree" CTA

**Implementation:**
- New `/compare/[user1]/[user2]/[template-slug]` route
- Query both users' lists for same template
- Display side-by-side with visual diff

**Files to create:**
- `app/compare/[user1]/[user2]/[templateId]/page.tsx`

---

## Lower Priority (Bigger Builds)

### 3. Controversy/Agreement Stats
Show stats like "Most divisive: The Godfather (ranked #1 by 12, ranked #47 by 3)".

**What it does:**
- Aggregates rankings across all users with same template
- Shows most agreed-upon items
- Shows most controversial/divisive items
- Creates conversation and debate

**Implementation:**
- Aggregate query across all list_items for a template
- Calculate variance in rankings per item
- Display on template landing page

---

### 4. Completion Challenges / Gamification
"Only 23% of people finish their Top 50. Can you?"

**What it does:**
- Shows completion percentage for list type
- Progress bar on user's list
- Badges for completing lists
- Shareable achievements

**Implementation:**
- Calculate completion rates per template
- Add `is_complete` flag or calculate from items
- Create badge/achievement system
- Shareable achievement cards

---

### 5. Template Discovery from Shares
Optimized landing experience when someone follows a shared link.

**What it does:**
- Prominently shows "X others have this list"
- One-click "Start your own version" for logged-in users
- Pre-selects template for signup flow
- Reduces friction from share → new user creation

**Implementation:**
- Store template_id in signup flow params
- After signup, auto-create list from template
- Add prominent CTA in list header

---

### 6. Email/Push Notifications
"Someone ranked differently" - notifications for interesting activity.

**What it does:**
- Notify when someone you follow makes a surprising ranking choice
- Weekly digest of activity in templates you're in
- New follower notifications

**Implementation:**
- Email service integration (Resend, SendGrid, etc.)
- Notification preferences in profile
- Background job for digest emails

---

## Completed

- [x] Better OG meta tags with dynamic content
- [x] Share button on list pages
- [x] Signup CTA on public list pages ("How would you rank yours?")
- [x] "Join X others" messaging in create flow
- [x] "See how others ranked theirs" section on list pages

---

## Notes

- Shareable image cards likely highest ROI for virality
- Comparison links are good for direct sharing between friends
- Gamification can increase engagement but may not drive new signups
- Consider A/B testing CTA copy variations
