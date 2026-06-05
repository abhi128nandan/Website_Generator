<think>
Okay, let's tackle this Layout component. The user wants a responsive layout with header, main, and footer. Since there are no specific app features, I'll make it generic but still premium-looking.

First, I'll start with TypeScript and functional components. The component should accept props, so I need an interface. Maybe something like LayoutProps with children and maybe a theme toggle? Wait, the requirements don't mention any interactive elements except for the hover states and animations. Hmm, but the icons include Sun and Moon, so maybe a dark mode toggle? That would add some interactivity.

Let me think about the structure. The header should have a logo and navigation, maybe a menu icon for mobile. The main content area is just a placeholder for children. The footer should have some links and a copyright.

For Tailwind, I need it to be responsive. Let's use flex or grid. Maybe a flex column for mobile, switching to a flex row with header and main on the sides. Wait, the footer should be at the bottom. So perhaps a flex column with header, main, footer. But on larger screens, the main content might take more space.

Tailwind's min-h-screen could help. Let's set the main layout to min-h-screen, and use flex-col with items-stretch. Header and footer with fixed heights, main content growing.

For the header, maybe a fixed position? Or sticky? If it's fixed, the main content should have padding-top. But maybe better to use flex so that the layout adjusts properly.

Icons from lucide-react. Let's include a dark mode toggle with Sun and Moon icons. Also, maybe a menu icon for navigation on mobile. But the requirements don't specify navigation items, so perhaps just a placeholder.

The header could have a logo on the left, navigation links in the middle, and the dark mode toggle and menu icon on the right. But since it's a generic layout, maybe keep it simple with a title and the toggle.

Let me outline the structure:

- Header: flex items-center justify-between p-4
- Main: flex-grow container for children
- Footer: p-4 text-center

Dark mode toggle: a button with an icon that switches between Sun and Moon. Use Tailwind's dark class toggled by state.

State management for dark mode can be done via React's useState. When the button is clicked, it toggles the state, which applies the dark class to the body or a container.

But since the component is supposed to be self-contained, maybe the dark mode is applied as a class on the main container? Or perhaps the component wraps the children with a div that has dark classes.

Wait, but the component is a layout wrapper, so it should handle the dark mode for the entire app. But since it's a component, maybe it's better to toggle the class on the body. However, in React, modifying the body class directly can be done via useEffect. Let me think.

Alternatively, apply the dark class to a container div that wraps the entire layout. But that might not cover all elements. Hmm. Maybe using Tailwind's dark: variants and managing a state that applies dark:bg-gray-900 etc.

But perhaps the simplest way is to use the system's preference and allow the component to toggle it. Let me include a button that toggles dark mode by adding/removing the 'dark' class on the HTML element. However, in React, it's better to manage this via state and then apply the class conditionally.

Let me proceed with state for dark mode. When the component mounts, check the system preference. Then, when the toggle is clicked, it switches the state. The Tailwind classes will use the dark: variants based on that state.

Now, the footer should have some links and a copyright. Maybe "UnnamedApp © 2023" or similar.

Responsive design: On smaller screens, the header's nav links might collapse into a menu. But since the component doesn't have specific navigation, perhaps a simple menu icon that toggles a mobile menu. But again, the component is supposed to be self-contained without any other components. Let's keep it simple. Maybe on mobile, the header just has a menu icon, but the actual menu isn't implemented. Or just leave it as a placeholder.

For icons, use the Menu icon for the mobile menu and Sun/Moon for the toggle.

Let me start writing the component. The props for Layout would be children. Wait, the requirements say to accept props via a typed interface. But the task is just to create a Layout component. Maybe the LayoutProps would include children, but perhaps no other props? So the interface is:

interface LayoutProps {
  children: React.ReactNode;
}

But maybe the user wants to pass additional props like a theme or something else. However, since the task is to create a responsive layout wrapper, the only required prop is children.

Now, the component will use useState for dark mode. Also, useMediaQuery or similar for responsive behavior? Or just Tailwind's responsive utilities.

Putting it all together:

- The Layout component wraps the children in a div with header, main, and footer.
- Header has a title, a nav with links (maybe just placeholders), and a dark mode toggle.
- Main content is the children.
- Footer has some links and copyright.

Testing the dark mode: when the button is clicked, the state toggles, and the Tailwind classes apply dark styles.

For the dark mode toggle button, use the Sun and Moon icons based on the state.

Let me code this step by step.

Import React and useState. Also, import the necessary icons from lucide-react: Sun, Moon, Menu.

The component function:

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
      <header className="p-4 shadow-md flex items-center justify-between bg-white dark:bg-gray-800">
        <div className="text-xl font-bold">UnnamedApp</div>
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400">Home</a>
            <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400">Features</a>
            <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400">Contact</a>
          </nav>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-color