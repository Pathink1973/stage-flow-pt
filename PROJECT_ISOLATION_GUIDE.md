# Project Isolation Guide - Multi-Deployment Support

## Overview

This project now supports **multiple independent deployments** (e.g., Portuguese and English versions) sharing the same Supabase database while maintaining complete data isolation.

## What Changed

### 1. Database Schema
- Added `project_id` column to all tables:
  - `profiles`
  - `rooms`
  - `room_members`
  - `cues`
  - `timers`
  - `messages`
  - `qa_submissions`
  - `device_sessions`
  - `timer_color_settings`

- Default value: `'default'` for existing data
- Indexed for performance
- Enforced at application level

### 2. Application Code
- All database queries now filter by `PROJECT_ID`
- New environment variable: `VITE_PROJECT_ID`
- Automatic isolation in:
  - User authentication
  - Room creation/access
  - Timer synchronization
  - QA submissions
  - Messages and cues
  - Device sessions

### 3. URL Configuration
Each deployment uses its own public URL via `VITE_PUBLIC_URL` environment variable.

## Deployment Instructions

### For Portuguese Version (Existing)

**Netlify Environment Variables:**
```bash
VITE_SUPABASE_URL=https://scztmzwsxnvfrmzqicte.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_PUBLIC_URL=https://stageflow-pt.netlify.app
VITE_PROJECT_ID=pt
```

### For English Version (New Deployment)

**Netlify Environment Variables:**
```bash
VITE_SUPABASE_URL=https://scztmzwsxnvfrmzqicte.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_PUBLIC_URL=https://stageflow-en.netlify.app
VITE_PROJECT_ID=en
```

## How It Works

### Data Isolation

```typescript
// Example: Fetching rooms
const { data } = await supabase
  .from('rooms')
  .select('*')
  .eq('owner_id', user.id)
  .eq('project_id', PROJECT_ID)  // ← Isolates by project
  .order('created_at', { ascending: false });
```

Every database operation includes `project_id` filtering, ensuring:
- PT users only see PT data
- EN users only see EN data
- No cross-contamination
- Independent user bases
- Separate room slugs

### QR Code Separation

**Portuguese Deployment:**
- QR codes point to: `https://stageflow-pt.netlify.app/room/{slug}/stage`
- Only accesses rooms with `project_id='pt'`

**English Deployment:**
- QR codes point to: `https://stageflow-en.netlify.app/room/{slug}/stage`
- Only accesses rooms with `project_id='en'`

### User Isolation

Users are project-scoped:
- A user created in PT project can only access PT data
- A user created in EN project can only access EN data
- Same email can exist in both projects independently
- Separate authentication sessions

## Benefits

✅ **Complete Data Isolation**
- No risk of data leakage between projects
- Each deployment acts as independent instance

✅ **Shared Infrastructure**
- One Supabase database
- Reduced costs
- Simplified maintenance

✅ **Independent Scaling**
- Each project can grow independently
- No conflicts in room slugs
- Separate user bases

✅ **Easy Management**
- Single codebase
- Same features across all projects
- Easy to add new language deployments

## Adding a New Language/Project

1. **Deploy to Netlify:**
   - Create new site from same repository
   - Set environment variables:
     ```bash
     VITE_PROJECT_ID=<new_language_code>
     VITE_PUBLIC_URL=https://stageflow-<lang>.netlify.app
     ```

2. **No Database Changes Needed:**
   - Existing schema supports unlimited projects
   - Automatic isolation via `project_id`

3. **Test Isolation:**
   - Create test account in new deployment
   - Create test room
   - Verify QR codes point to correct URL
   - Verify no cross-project data access

## Verification Checklist

- [ ] Environment variables set correctly in Netlify
- [ ] `VITE_PROJECT_ID` matches deployment purpose (pt, en, etc.)
- [ ] `VITE_PUBLIC_URL` matches Netlify site URL
- [ ] QR codes generate with correct URL
- [ ] Can create rooms in each project independently
- [ ] Users cannot see data from other projects
- [ ] Stage display works with project-specific data
- [ ] QA submissions isolated by project

## Troubleshooting

### Issue: QR codes show wrong URL
**Solution:** Check `VITE_PUBLIC_URL` in Netlify environment variables

### Issue: Seeing data from other project
**Solution:** Verify `VITE_PROJECT_ID` is set correctly and matches deployment

### Issue: Cannot access stage display
**Solution:** Ensure RLS policies allow public read access to rooms, timers, cues, messages tables

### Issue: Room slug conflicts
**Solution:** This shouldn't happen as slugs are project-scoped. If it does, check database constraints.

## Technical Details

### Database Indexes
All tables have indexes on `project_id` for optimal query performance:
```sql
CREATE INDEX idx_rooms_project_id ON rooms(project_id);
CREATE INDEX idx_timers_project_room ON timers(project_id, room_id);
-- ... etc
```

### Composite Unique Constraints
Room slugs are unique per project:
```sql
CREATE UNIQUE INDEX rooms_project_slug_unique ON rooms(project_id, slug);
```

### Row Level Security
RLS policies remain mostly unchanged, but application-level filtering ensures isolation.

## Migration History

- `add_project_isolation.sql` - Added project_id columns and indexes
- All existing data assigned `project_id='default'`
- Non-destructive migration

## Support

For issues or questions, check:
1. Environment variables in Netlify
2. Browser console for errors
3. Supabase logs for database issues
4. Network tab for API calls

---

**Last Updated:** 2025-10-16
**Version:** 1.0.0
