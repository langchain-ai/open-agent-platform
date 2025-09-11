import { useState, useEffect, useCallback } from "react";

// Define a type for the hook's return value
type UseLocalStorageReturnType<T> = [T, (value: T | ((val: T) => T)) => void];

/**
 * Custom hook for persisting state in localStorage.
 *
 * @param key The key to use for storing the value in localStorage.
 * @param initialValue The initial value to use if no value is found in localStorage.
 * @returns A tuple containing the stored value and a function to update it.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): UseLocalStorageReturnType<T> {
  // Function to get the stored value from localStorage or return the initial value
  const getStoredValue = useCallback(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Function to set the value in localStorage and update the state
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes to the localStorage from other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch (error) {
          console.warn(
            `Error parsing localStorage value for key "${key}" on storage event:`,
            error,
          );
        }
      } else if (event.key === key && !event.newValue) {
        // Handle item removal
        setStoredValue(initialValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Update state if value changes in another tab
    // This is important for initial load in case another tab updated the value
    // after this component mounted but before the event listener was attached.
    const currentValue = getStoredValue();
    if (currentValue !== storedValue) {
      setStoredValue(currentValue);
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, initialValue, getStoredValue, storedValue]); // Added storedValue to dependencies

  return [storedValue, setValue];
}
