export const useSettings = () => {
  const [darkMode, setDarkMode] = React.useState<boolean>(false);
  const [username, setUsername] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const savedUsername = localStorage.getItem("username");
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === "true");
    }
    if (savedUsername !== null) {
      setUsername(savedUsername);
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
  }, [darkMode]);

  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    localStorage.setItem("username", e.target.value);
  }, []);

  const saveChanges = useCallback(() => {
    if (username.trim().length === 0) {
      setError("Username cannot be empty");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Simulate API call with setTimeout
      setTimeout(() => {
        setLoading(false);
        localStorage.setItem("username", username);
      }, 500);
    } catch (e) {
      setError("Failed to save changes");
      setLoading(false);
    }
  }, [username]);

  return {
    darkMode,
    toggleDarkMode,
    username,
    setUsername: handleUsernameChange,
    saveChanges,
    error,
    loading,
  };
};