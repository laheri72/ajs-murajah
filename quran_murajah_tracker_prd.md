# Product Requirements Document (PRD)

## 1. Product Overview
**Product name:** Quran Murajah Tracker

**Purpose:**
A room-based Quran revision tracking system for the university hostel (“Maskan”) that helps every room track weekly Quran recitation progress across an academic year, while giving the admin full oversight of targets, analytics, and participation.

**Core principle:**
Make tracking almost frictionless. The system must support one-click progress updates so room heads can log completion in seconds.

---

## 2. Problem Statement
Maskan management wants every room to collectively complete one full Quran during the academic year. The current process needs a structured, easy-to-use system that:
- assigns rooms and floors,
- defines a target for each room,
- lets room heads update progress quickly,
- allows admin to monitor completion, trends, and underperforming rooms,
- supports future reminders, goals, rankings, and charts.

Without a tracking system, progress becomes hard to verify, difficult to compare, and easy to forget.

---

## 3. Goals
### Primary goals
1. Enable room-based Quran tracking with minimal interaction.
2. Let admin create and manage rooms, floors, and targets.
3. Show room progress clearly and instantly.
4. Provide an admin dashboard with analytics, trends, and room status.
5. Support shared room login credentials for easy access.

### Secondary goals
1. Support monthly, weekly, or custom goals.
2. Provide internal reminders/notifications later.
3. Add leaderboards, achievements, and trend views later.
4. Support undo, bulk select, and fast corrections.

---

## 4. User Types and Permissions
### Admin
- Create floors
- Create rooms
- Assign rooms to floors
- Set room credentials
- Set room member count
- Configure targets
- View all analytics and reports
- Track room progress across the hostel
- Publish reminders or announcements

### Room Head
- Log in with room credentials
- View assigned room progress
- Mark Quran portions as completed
- Undo or edit recent entries
- View room progress, target, and weekly status

### Future roles (optional)
- Floor coordinator
- Supervisor
- Student member with read-only access

---

## 5. Scope
### MVP scope
The first version must include:
- Admin login
- Room login
- Room creation and editing
- Floor creation and editing
- Target setup
- Rub’/Quran segment progress tracking
- Room dashboard
- Admin dashboard
- Analytics summary
- Progress history
- Simple internal session persistence

### Out of scope for MVP
- Google authentication
- Mobile app
- Push notifications
- WhatsApp integration
- AI insights
- Attendance or attendance-based tracking
- Complex enterprise security features

---

## 6. Quran Tracking Model
The app should track progress using **Rub’** units instead of pages.

### Tracking strategy
- Quran = 30 Juz
- Each Juz = 4 Rub’
- Total = 120 Rub’

This is the main completion unit.

### Why Rub’ is chosen
- Easy to tap and understand
- More practical than page-based tracking
- More consistent for progress calculations
- Better for analytics and charts

### Tracking rules
- A room can mark one or multiple Rub’ as completed.
- A room can undo a recent completion.
- Each completion event is stored with a timestamp.
- Progress is always calculated from completed Rub’ vs target Rub’.

---

## 7. Core Features
### 7.1 Admin room management
Admin can create and edit rooms with:
- Room name
- Member count
- Username
- Password
- Floor assignment
- Optional future metadata fields

### 7.2 Floor management
Admin can create floors such as:
- Ground Floor
- Floor 1
- Floor 2
- Floor 3

Each floor can contain multiple rooms.

### 7.3 Room progress tracking
Room heads can:
- see a visual Quran tracker,
- mark Rub’ as completed,
- unmark recently completed Rub’,
- view total completion percentage,
- see remaining target.

### 7.4 Admin analytics
Admin can view:
- total rooms
- total completed Rub’
- completion percentage by floor
- completion percentage by room
- room rankings
- underperforming rooms
- weekly trend summary
- overall hostel completion snapshot

### 7.5 Goal management
Admin can define:
- yearly target per room
- weekly target per room
- monthly target per room
- custom target windows

### 7.6 Activity tracking
System should store:
- who updated progress
- which room was updated
- what was completed
- when it was completed
- whether it was undone later

---

## 8. Functional Requirements
### Admin side
1. Admin can log in with a username and password.
2. Admin can create a floor.
3. Admin can create a room.
4. Admin can assign room to a floor.
5. Admin can set room credentials.
6. Admin can update room member count.
7. Admin can set or change targets.
8. Admin can view all room statistics.
9. Admin can see floor-wise analytics.
10. Admin can view activity logs.

### Room side
1. Room head can log in using room username and password.
2. Room head is taken directly to their room dashboard.
3. Room head can view current progress.
4. Room head can mark Rub’ as completed.
5. Room head can undo recent actions.
6. Room head can view weekly and total progress.
7. Session should persist in browser so repeated login is not needed often.

### System behavior
1. The system must save progress instantly.
2. The system should update metrics immediately after action.
3. The system should allow future expansion for notifications.
4. The system should keep data structured for later analytics.

---

## 9. Success Metrics
The app will be considered successful if:
- room heads can update progress in under 5 seconds,
- admin can see all room status in one dashboard,
- there is low friction in login and tracking,
- weekly participation remains visible and measurable,
- the system is easy enough for non-technical users to adopt.

---

## 10. Risks and Constraints
### Risks
- users may forget to update progress
- room heads may share credentials casually
- data may be entered incorrectly
- admin may need corrections later

### Constraints
- free or low-cost stack preferred
- no enterprise-level auth initially
- must be responsive and simple
- must work well on mobile browsers

---

## 11. Future Enhancements
- trends across floors
- room leaderboards
- achievements and badges
- reminder system
- internal notifications
- chart views
- monthly goal engine
- exportable reports
- multi-hostel support
- advanced analytics

---

## 12. Product Summary
This is a room-based Quran completion dashboard where the admin controls setup and visibility, while room heads track progress through a fast, modern, and intuitive interface. The entire product should be designed for one-click logging and clear progress visibility.

