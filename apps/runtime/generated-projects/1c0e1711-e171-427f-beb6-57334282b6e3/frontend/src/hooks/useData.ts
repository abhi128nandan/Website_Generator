import { authService } from '../services/authService';

export function useData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authService.getToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      // Placeholder for actual data fetching logic if needed
      const mockData = { message: 'Data fetched successfully!' };
      setData(mockData);
    } catch (e) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  const createData = useCallback(async (payload: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const token = authService.getToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return false;
      }
      // Placeholder for actual data creation logic
      setData((prevData: any) => ({ ...prevData, ...payload }));
      return true;
    } catch (e) {
      setError('Failed to create data');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteData = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const token = authService.getToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return false;
      }
      // Placeholder for actual data deletion logic
      setData(null);
      return true;
    } catch (e) {
      setError('Failed to delete data');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchData,
    createData,
    deleteData,
  };
}