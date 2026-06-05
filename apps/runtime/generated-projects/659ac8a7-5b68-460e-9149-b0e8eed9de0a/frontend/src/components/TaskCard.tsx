<think>
Okay, let's tackle this TaskCard component. The user wants a reusable React component with TypeScript and Tailwind. First, I need to outline the props. The task should have title, description, due date, status, priority, and maybe category. Let me think about the interface.

So, the props interface should include title (required), description (optional), dueDate (string or Date?), status (completed or pending), priority (high, medium, low), and maybe category. Let me make sure the types are right. For status, an enum or a union type. Same for priority. Let's use strings for simplicity.

Now, the component needs to display all these elements. Let's break down the UI. A card with a header, maybe the title, and then details. Icons from lucide-react for priority and status. For example, high priority could be a star, medium a clock, low a check. Or maybe different icons? Wait, the user listed valid icons. Let me check what's allowed. High priority could be AlertCircle, medium a Clock, low a Check? Or maybe Star for high? The user included Star in the valid icons. Maybe Star for high, Clock for medium, Check for low? Or maybe use different icons for priority. Alternatively, maybe use color coding with different icons. Let me decide. Let's use Star for high, Clock for medium, Check for low. Or maybe use a different approach. Wait, the priority is high/medium/low. Maybe use a flame for high, but the allowed icons don't have flame. Oh, the valid icons include Thermometer, which could be used for priority? Hmm. Alternatively, maybe use different icons for priority. The user provided a list. Let me check again. The valid icons include Star, which could represent high priority. Maybe high is Star, medium is Clock, low is Check. That's acceptable.

For status, completed vs pending. Maybe a Check icon for completed, or a different color. Maybe a CheckCircle or similar. But the allowed icons include Check. Maybe a Check inside a circle for completed, or maybe a different color. Alternatively, use a different icon. Let's see, the user's allowed icons include Check and AlertCircle. Maybe for completed, a Check icon, and for pending, maybe a Clock. Or maybe just color coding.

Now, the structure of the card. Using Tailwind's flex or grid. Maybe a flex column. Card background, padding, shadow, rounded. Let's start with a flex container, maybe with a header, body, and footer sections.

The title should be prominent, maybe a heading. Description below. Due date could be in a corner. Priority indicators. Status badges. Also, maybe interactive elements like hover effects. Clickable card? Or just visual elements.

Icons for priority: depending on the priority, show the respective icon with colors. For example, high priority in red, medium in yellow, low in green. Tailwind's text and bg colors can handle that.

For status, maybe a badge with a label and color. Completed in green, pending in yellow. Maybe using Tailwind's utility classes.

Now, putting it all together. The component will receive props and render the elements. Let's outline the JSX structure.

Start with a div with className for the card. Maybe something like:

<div className="bg-white rounded-lg shadow-md p-4 max-w-sm w-full hover:shadow-lg transition-shadow">

Inside, the title could be h5, then description as a paragraph. Then, a section for due date, priority, and status.

For the icons, import the necessary ones from lucide-react. So, for high priority, import Star; medium, Clock; low, Check. For status, completed: Check, pending: Clock?

Wait, maybe for status, completed could be CheckCircle (but allowed icon is Check), maybe use a Check inside a circle. Or perhaps a different approach. Let me think. For status, maybe a badge with a checkmark for completed, and a clock for pending. But the user might prefer textual labels. Alternatively, use colors: green for completed, yellow for pending.

Let me sketch the props interface first:

interface TaskCardProps {
  title: string;
  description?: string;
  dueDate: string; // or Date, but converting to string for display
  status: 'completed' | 'pending';
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

Now, for each prop, display accordingly. The category is optional; maybe add a badge for it.

For the icons, in the component:

- Priority Icon: based on priority, select the icon and color.
High: Star with red, Medium: Clock with yellow, Low: Check with green.
- Status Icon: Completed: Check with green, Pending: Clock with amber.

Wait, maybe for status, completed is a CheckCircle, but the allowed icon is Check. So perhaps a Check inside a circle, styled with appropriate colors.

Now, code structure:

Import React, lucide icons.

Define TaskCardProps interface.

Function component: TaskCard({ props }) => JSX.

Inside the JSX, structure:

Card container with Tailwind classes.

Title: <h5 className="text-lg font-semibold mb-2">...</h5>

Description: {description && <p className="text-sm text-gray-600 mb-2">...</p>}

Due date: Maybe a badge with a Clock icon and date. Like <div className="flex items-center text-sm text-gray-500"> <Clock className="w-4 h-4 mr-1" /> {dueDate}</div>

Priority: a badge with icon and text. For example, a div with bg-red-100 text-red-800 for high, etc.

Status: another badge, maybe with Check or Clock icon, colored accordingly.

Category: if present, a badge with text and background.

Now, applying the colors:

Priority:

high: bg-red-100 text-red-800, border-red-200

medium: bg-yellow-100 text-yellow-800, border-yellow-200

low: bg-green-100 text-green-800, border-green-200

Status:

completed: green, pending: amber/yellow.

For icons, in each case:

Priority icon:

switch on priority:

high: <Star />

medium: <Clock />

low: <Check />

Status icon:

status === 'completed' ? <Check /> : <Clock /> ?

But maybe for pending, use a different icon. Maybe a RefreshCw or something else. Wait, the user said valid icons include Clock and RefreshCw. Let's stick with the initial idea.

Now, for the Tailwind classes, using conditional classes based on props.

Also, making sure the card is responsive. Tailwind's responsive utilities.

Now, adding hover states and transitions. For example, when hovering over the card, the shadow increases, maybe some opacity change on icons, or a subtle animation.

Now, putting all together in code.

Importing the icons:

import { Star, Clock, Check, Check as CheckIcon } from 'lucide-react';

Wait