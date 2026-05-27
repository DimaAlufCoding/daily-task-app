# Ticket Management System

## Problem

Most daily task management tools are built around fixed schedules and calendar-based planning. For example, if I schedule "Go to the gym" for 9:00 AM but I wake up late or get delayed, I need to manually update the calendar event or move it to another time.

The problem is that many daily tasks are not truly time-dependent — they simply need to be completed sometime during the day.

Current calendar systems create unnecessary friction:

* Constantly updating times
* Feeling like you "failed" the day because you missed a scheduled hour
* Overcomplicated planning for simple daily tasks
* Mixing flexible tasks with real time-based meetings/events

This creates stress and reduces productivity instead of simplifying daily organization.

## Solution

Build a Jira-style daily task organizer where tasks are managed as tickets instead of scheduled calendar events.

Instead of assigning every task a specific hour, users create a daily board each morning with the tasks they want to complete during the day.

The system focuses on:

* What needs to be done
* Not exactly when it needs to be done

Users can drag and move tasks between statuses during the day, similar to a Jira workflow:

* To Do
* In Progress
* Done
* Move to Next Day

This creates a more flexible and stress-free productivity system that matches how people actually manage personal tasks.

The platform combines:

* The simplicity of a daily planner
* The flexibility of a task board
* The workflow experience of Jira

## Features

* Dashboard to view and manage all daily tickets
* Jira-style Kanban board with 4 columns: To Do / In Progress / Done / Move to Next Day
* Drag & drop ticket management
* Daily task planning
* Ticket detail view
* Add, edit, and delete tickets
* Create tickets by sending emails
* Incoming email processing using Mailgun webhooks
* Basic predefined daily ticket templates
* Option to create custom tickets
* Ticket list with filtering and sorting by category
* Categories: Health, Work, Shopping, Personal (predefined; custom categories planned for future versions)
* Priority levels: Low, Medium, High
* Daily progress tracking
* Search functionality
* Mobile-friendly responsive design
* User authentication (email + password)
* User management (admin only)

## Decisions

### Email-to-Ticket Flow

* Users can create tickets by sending emails to a dedicated inbox.
* Mailgun webhooks will forward incoming emails to the backend API.
* Email subject becomes the ticket title.
* Email body becomes the ticket description.
* Tickets created from email are automatically assigned to the current day's board.
* Unknown senders are ignored unless mapped to an existing user account.
* Attachments are deferred to a future version.

### Daily Board Lifecycle

* The board is generated automatically each morning based on the current date — no manual action required.
* Tasks marked "Done" at end of day are archived into history.
* Tasks still in "To Do" or "In Progress" at end of day can be moved to the "Move to Next Day" column.
* Tickets in "Move to Next Day" automatically appear in the next day's "To Do" column.
* "Move to Next Day" tasks roll forward indefinitely until completed or deleted.

### Kanban Board

* "Move to Next Day" is a dedicated, visible column on the board alongside To Do / In Progress / Done.
* Its purpose is to give users an intentional way to postpone tasks without deleting them or feeling like they failed the day.

### Recurring Tasks

* Not in v1. Templates cover the use case for now.
* Future versions will support daily habits, weekly routines, and monthly reminders that automatically appear in the daily board.

### Authentication

* Email + password for v1. Google OAuth deferred to a future version.
* Personal productivity product — not a team or enterprise platform.
* Admin role handles basic platform administration: view users, deactivate accounts, reset passwords.

### Data & Storage

* Cloud-synced database. Data is tied to the user account and accessible across all devices.
* Users can build their board on desktop and update tasks from mobile seamlessly.

### Progress Tracking

* Daily completion percentage (completed vs. total tasks).
* Simple weekly statistics.
* Advanced analytics, streaks, and productivity insights deferred to future versions.

### Notifications

* Lightweight and optional.
* v1 may include a gentle morning reminder to build the daily board and an optional end-of-day review reminder.
* Focus is on reducing scheduling anxiety, not creating more interruptions.

### Categories

* Default categories: Health, Work, Shopping, Personal.
* Custom user-defined categories are planned for a future version.
