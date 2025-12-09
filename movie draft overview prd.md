Overview / PRD (Product Requirements Document)
What are we building?

A locally hosted web application for running a fantasy movie draft among friends. The app supports a snake-style draft for 6 members, each drafting movies into 6 categories from a pool of 100 movies. The app displays movie posters, enforces draft order, and provides real-time visual feedback on draft progress. Key views include a live draft board, a matrix view of all picks, and category/member breakdowns. A 2-minute shot clock is included for each pick.

Why are we building it?

To streamline and visually enhance the process of running a fantasy movie draft, making it easy to track picks, see available movies, and compare teams and categories in real time. The app replaces manual tracking (e.g., spreadsheets or paper) with an engaging, poster-driven interface.

Who is it for?

A group of 6 friends (club members) who have watched a curated list of 100 movies over the last five years and want to draft their favorites into themed categories. One user will operate the app on behalf of the group during the draft session.

Use Cases
Live Drafting: The group gathers and one user operates the app, making picks for each member in turn. The app enforces snake draft order and a 2-minute timer for each pick.

Movie Search: During a member's turn, the operator uses the search bar to quickly filter available movies by title, then selects a movie to draft.

Draft Board Monitoring: All members can view the live draft board, seeing which movies have been picked, which are still available, and whose turn it is.

Team Review: At any time, the operator can switch to a view showing all picks for a specific member, organized by category, to review or discuss team composition.

Matrix Comparison: The group can view a matrix/grid showing all categories as rows and all members as columns, with each cell displaying the movie picked (or empty if not yet picked), for quick cross-team and cross-category comparison.

Category Review: The operator can select a category to see all members' picks for that category, with posters and names, to facilitate discussion or analysis.

Requirements
Core Functional Requirements

Draft Setup

The app must support exactly 6 members and 6 categories per draft session.
The app must load a list of 100 movies, each with a title and a poster image (fetched from flickchart.com or a placeholder if unavailable).
The app must allow the operator to assign member names and category names before the draft begins.
Live Draft Board

The main screen must display:
All 6 members as columns, each with 6 category slots (empty or filled with a movie poster/title).
A clear indicator of whose turn it is (e.g., highlight, label "(On the Clock)").
A 2-minute countdown timer for the current pick, with the label: "⏰ [mm:ss]".
A visual indicator of the draft order (snake style), e.g., avatars/names with arrows.
A grid of available movies, each showing the poster and title.
A search bar above the available movies grid with the placeholder: "Search movies by title...". Typing filters the grid in real time.
A button labeled "Pick Selected Movie" to confirm the current pick.
When a movie is picked, it is removed from the available pool and placed in the correct member/category slot.
The draft order must alternate each round (snake style: 1-6, 6-1, etc.).
If the timer reaches zero, the app must display a modal or alert: "Time's up! Please make a pick to continue."
Member Team View

The app must provide a view to display all picks for a selected member, organized by category.
Each category row/card must show:
The category name
The movie poster and title if filled, or the label "(Empty)" if not
A dropdown or tab control must allow switching between members.
All Members Matrix View

The app must provide a matrix/grid view with:
Categories as rows (leftmost column)
Members as columns (top row)
Each cell showing the movie poster and title for that member/category, or "Empty" if not filled
The layout must be scannable and visually clear for cross-comparison.
Category View

The app must provide a view to display all members' picks for a selected category.
Each member is shown with their avatar, name, and the movie poster/title for their pick (or "Empty" if not filled).
A dropdown or tab control must allow switching between categories.
System Behaviors & Edge Cases

The app must prevent the same movie from being picked more than once.
The app must prevent a member from picking more than one movie per category.
If a pick is attempted when the timer is at zero, the app must still allow the pick but should display the "Time's up!" alert until a pick is made.
If a movie poster cannot be fetched, display a placeholder image with the label "Poster unavailable".
All views must update in real time as picks are made.
UI Elements & Copy

Search bar placeholder: "Search movies by title..."
Timer label: "⏰ [mm:ss]"
Pick confirmation button: "Pick Selected Movie"
Empty slot label: "(Empty)"
Poster unavailable label: "Poster unavailable"
Time's up modal/alert: "Time's up! Please make a pick to continue."
Data Handling & Integration

Movie data (title, poster URL) must be loaded at app start.
Poster images should be fetched from flickchart.com if possible; otherwise, use a placeholder.
All draft state (picks, timer, available movies) must be stored locally in browser memory (no backend required for MVP).
Navigation & Flow

The operator must be able to switch between the Live Draft Board, Member Team View, Matrix View, and Category View at any time.
All views must reflect the current draft state instantly.
Accessibility & Usability

All interactive elements (buttons, dropdowns, search) must be keyboard accessible.
Movie posters must have alt text: "Poster for [Movie Title]" or "Poster unavailable".
The app must be usable on a standard laptop/desktop screen (no mobile optimization required for MVP).