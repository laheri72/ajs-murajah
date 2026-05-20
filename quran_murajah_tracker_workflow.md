# Workflow Document

## 1. Purpose
This document describes how the product should operate from setup to daily usage. It is intended to help Codex build the application logic, user journey, and screen flow correctly.

---

## 2. Overall System Flow
The app has two primary operating modes:

1. **Admin mode**
2. **Room mode**

Admin creates and manages the structure. Room heads log progress in a very fast, repeatable workflow.

---

## 3. Setup Workflow
### Step 1: Admin creates floors
- Admin opens the floor management page.
- Admin adds floor names and order.
- Example: Floor 1, Floor 2, Floor 3.

### Step 2: Admin creates rooms
For each room, admin adds:
- room name
- member count
- username
- password
- floor assignment
- optional future metadata

### Step 3: Admin assigns room to floor
- Each room is mapped to one floor.
- A floor can contain multiple rooms.
- Example: Floor 2 may contain rooms 2021, 2022, 2023, 2024.

### Step 4: Admin defines tracking expectations
- yearly target
- weekly target
- monthly target (optional)
- room-specific rules (optional)

### Step 5: Admin shares credentials
- Room credentials are shared with room heads.
- Room head stores session in browser for convenience.

---

## 4. Room Login Workflow
### Step 1: Open login page
Room head visits the app and enters:
- username
- password

### Step 2: Authenticate
- System validates credentials.
- If valid, room head is taken directly to the room dashboard.

### Step 3: Persist session
- Browser session remains active.
- Room head does not need to log in every time unless session expires.

---

## 5. Daily Tracking Workflow
The app must support a very fast routine.

### Room head daily flow
1. Open room dashboard.
2. See current progress immediately.
3. Tap one or more Rub’ blocks.
4. Progress updates instantly.
5. Session and data are saved.

### Action behavior
- Tap to mark completed.
- Tap again to undo.
- Multi-select mode can be used when several Rub’ are completed at once.
- A toast or confirmation message appears after each save.

---

## 6. Weekly Tracking Workflow
### Weekly expectation
Each room should maintain progress over the week so it can be measured against its target.

### Weekly cycle
- Room head updates progress throughout the week.
- System calculates weekly completion.
- Admin views room and floor performance.
- Underperforming rooms become visible for follow-up.

### Weekly reset behavior
The system should not delete historical records. Instead, it should:
- keep all progress logs,
- compute weekly summaries from timestamps,
- show trends over time.

---

## 7. Undo Workflow
### Why undo is needed
Room heads may accidentally mark the wrong Rub’ or need to correct a previous entry.

### Undo flow
1. User taps the recently completed Rub’.
2. System marks it as undone.
3. Activity log stores both the completion and undo event.
4. Dashboard updates instantly.

### Best practice
Allow undo on recent records, but keep logs for audit and analytics.

---

## 8. Admin Management Workflow
### Create or edit room
Admin may:
- create a room
- edit room details
- change username/password
- change floor assignment
- change member count
- deactivate a room

### View room progress
Admin can open a room record and see:
- total completion
- weekly completion
- history
- trend chart
- recent updates

### Manage targets
Admin can set:
- yearly target
- monthly target
- weekly target
- custom target value

### Manage analytics
Admin can inspect:
- floor trends
- top rooms
- slow rooms
- completion ratios
- total progress across Maskan

---

## 9. Data Flow
### When a user marks progress
1. Frontend captures the click.
2. The action is sent to the backend.
3. Backend validates room credentials/session.
4. Backend writes to the progress table.
5. Backend updates summary fields or computed views.
6. Frontend refreshes the visible state.

### When admin updates configuration
1. Admin submits form.
2. Backend saves changes to database.
3. Frontend updates tables and summary cards.
4. Related analytics reflect the new data.

---

## 10. App Navigation Flow
### Room mode navigation
- Login
- Room dashboard
- Progress tracker
- Recent activity
- Summary view

### Admin mode navigation
- Admin login
- Overview dashboard
- Floors
- Rooms
- Targets
- Analytics
- Activity logs
- Announcements/reminders (future)

---

## 11. Room Dashboard Workflow
The room dashboard should be the fastest screen in the product.

### Default state
- show room identity
- show floor
- show progress percentage
- show target bar
- show Quran Rub’ matrix
- show latest activity

### Usability requirement
The user should understand the room state within seconds of opening the screen.

---

## 12. Admin Dashboard Workflow
The admin dashboard should answer these questions instantly:
- How many rooms exist?
- Which floor is leading?
- Which room is behind?
- How much of the Quran target has been completed overall?
- Which rooms need attention?

### Admin workflow sequence
1. Open dashboard.
2. Review headline metrics.
3. Drill into floors.
4. Drill into rooms.
5. Adjust targets or room credentials.
6. Check activity logs.

---

## 13. Error Handling Workflow
### Invalid login
- Show clear invalid credentials message.
- Keep the user on the login screen.

### Network failure
- Show retry state.
- Preserve current UI state.

### Save failure
- Indicate that the action failed.
- Allow the user to retry.
- Prevent silent data loss.

### Missing room or floor
- Show empty state with admin action prompt.

---

## 14. Session Workflow
### Room sessions
- session persists in browser
- logout can be optional or admin-controlled
- expired sessions should redirect to login

### Admin sessions
- admin remains logged in during work session
- logout should clear session
- sensitive admin actions may require revalidation later

---

## 15. Logging and Audit Workflow
Every important change should be recorded:
- room creation
- floor creation
- credential updates
- progress update
- undo action
- target updates
- room deactivation

This supports accountability and future analysis.

---

## 16. Future Workflow Extensions
Later versions can add:
- internal reminder flow
- monthly goal check-ins
- leaderboards
- achievement unlocks
- trend comparison across floors
- notifications page
- scheduled summary reports

---

## 17. Recommended MVP Operating Logic
The MVP should operate as:
- admin sets structure
- room head logs progress in seconds
- data is stored automatically
- admin sees results and trends immediately

This is the simplest and strongest workflow for adoption.

