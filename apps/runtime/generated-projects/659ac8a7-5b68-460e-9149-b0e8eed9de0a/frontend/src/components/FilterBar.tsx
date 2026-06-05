<think>
Okay, let's see. I need to create a FilterBar component for a TodoManager app using React and Tailwind CSS. The component should handle status and priority filters. Let's start by understanding the requirements.

First, the component should accept props via a TypeScript interface. So I need to define the props. The user probably wants to pass current filter states and a function to handle changes. Maybe something like onFilterChange with status and priority.

Wait, the FilterBar has two main sections: status (completed/pending) and priority (high/medium/low). Each section should have toggle buttons. Since it's a filter bar, maybe they can select multiple priorities or statuses? Hmm, but the problem says "filters" so maybe it's single select? Or maybe multiple. The user didn't specify, but the component needs to be functional. Let me think. Typically, in a task manager, you might filter by multiple priorities or statuses. Wait, for status, it's usually either completed or pending. So maybe it's single select. For priority, maybe you want to see tasks with high and medium but not low. So the component should allow selecting multiple options.

But how to represent that in the UI? Maybe checkboxes for each priority and status? Or maybe dropdowns with multi-select. But since the user wants it to be a FilterBar, perhaps using buttons that can be toggled on/off for each option. So the filter will be an object with status and priority arrays.

The props would need to include the current status and priority selections, and a callback to update them. So the interface would be something like:

interface FilterBarProps {
  selectedStatus: 'completed' | 'pending' | null;
  setSelectedStatus: (status: 'completed' | 'pending' | null) => void;
  selectedPriority: ('high' | 'medium' | 'low')[];
  setSelectedPriority: (priority: ('high' | 'medium' | 'low')[]) => void;
}

Wait, but the user might want to select multiple priorities. So selectedPriority is an array. For status, maybe a single selection. But maybe the user wants to allow both. However, in the task description, it's mentioned that the FilterBar has "status (completed/pending)" and "priority (high/medium/low) filters". So for status, it's binary, and maybe you can select both, but typically, you would select either completed or pending or all (null). For priority, multiple selections.

So the component needs two sections. Let's think about the UI. The FilterBar should be a horizontal bar with two groups of buttons. For each group, there's a label and the buttons.

For the status, maybe two buttons: Completed and Pending. Clicking either sets the selectedStatus to that value. Maybe a third option for All, which is null. But the problem says the filters are status and priority. If the user wants to allow "All" as an option, maybe include that. But the problem didn't specify, so perhaps the default is all, and selecting one filter applies. So maybe the status is optional, and the default is no filter (null). But the component should have a way to toggle between completed and pending, and maybe a reset (clear filter). Alternatively, have a button for All.

But the problem says "status (completed/pending) and priority (high/medium/low) filters". Maybe the status can be either of those, or all. So the FilterBar should have a way to select either status. However, in the component, perhaps the user can select one or both. Wait, no, because a task can't be both completed and pending. So probably, the status is a single selection: completed, pending, or all (null). So the buttons are for completed and pending, and maybe a third for All. But the problem says the UI component has status filters, so perhaps the component allows selecting either completed, pending, or both (but logically, tasks are either one or the other). Hmm, maybe the selection is mutually exclusive. So clicking on a status button toggles between them, and clicking again unselects. Alternatively, it's a dropdown with options.

But for simplicity, maybe the FilterBar uses a group of buttons for each filter. Let's start with the Status section. The user can select Completed or Pending. For Priority, High, Medium, Low. Each can be selected or deselected.

Wait, but if the user can select multiple priorities, then for each priority, the button is toggled on or off. For example, clicking High adds it to the selectedPriority array. Clicking again removes it.

So the component needs two sections: one for Status and one for Priority. Each section has buttons that can be toggled.

Now, for the UI with Tailwind. It should be responsive. Maybe flexbox for layout. Let's structure it as a flex container with two sections (status and priority) separated by spacing.

Each section can be a flex column or row. Maybe a label above the buttons, like "Status" and "Priority". The buttons can be pill-shaped, using Tailwind's rounded-full or similar classes. For the buttons, active states have different colors.

Icons from lucide-react: For example, Check for completed, Clock for pending? Or maybe use icons that represent the status. For priority, maybe use different colors or icons. But the problem says to use specific icons. Let me check the allowed icons.

The valid icons include Check, which could represent completed. Maybe a Clock for pending? Or maybe use a different approach. Alternatively, use no icons for status, just text. Priority could have icons like Wind for high (urgency?), Thermometer for medium, maybe Sun for low? Or perhaps use Check, Star, and something else. But the user specified to use the valid icon names. Let me think. For priority, maybe use Check (high), Star (medium), and Clock (low)? Or maybe different ones. But the problem says to use the icons listed. Let me check the list again.

Valid icon names include: Check, Star, Sun, Moon, Wind, etc. For priority, maybe High could be a Check icon (indicating urgency), Medium as Star, Low as Sun? Or maybe use different colors for each priority. Alternatively, no icons, just text. Since the user wants a premium look, maybe using icons would enhance it. Let's proceed with icons for each priority. High: Check, Medium: Star, Low: Sun.

For status, Completed could have a Check icon, and Pending could have a Clock icon. Or maybe use a different approach. Let's check the icons again. The user says valid icon names include Check, Clock, etc. So Completed can have a Check, Pending a Clock.

So the FilterBar will have two sections. Each section starts with a label (e.g., "Status") and then buttons with icons and text.

Now, for the code structure. Using TypeScript with functional component. Import React, lucide-react for the icons.

The props interface should be typed. Let's define the props:

interface FilterBarProps {
  selectedStatus: 'completed' | 'pending' | null;
  setSelectedStatus: (status: 'completed' | '