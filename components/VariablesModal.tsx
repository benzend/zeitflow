import { useState, useEffect, useCallback } from "react";

interface VariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (variables: Record<string, string>) => void;
  chainId: number;
  chainName?: string;
}

export default function VariablesModal({
  isOpen,
  onClose,
  onSubmit,
  chainId,
  chainName,
}: VariablesModalProps) {
  const [variables, setVariables] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchVariables = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/chain-variables?id=${chainId}`);
      const data = await response.json();

      if (data.success) {
        setVariables(data.variables || []);
        // Initialize empty values
        const initialValues: Record<string, string> = {};
        data.variables?.forEach((variable: string) => {
          initialValues[variable] = "";
        });
        setValues(initialValues);
      } else {
        setError(data.message || "Failed to fetch variables");
      }
    } catch (err) {
      setError("An error occurred while fetching variables");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  useEffect(() => {
    if (isOpen && chainId) {
      fetchVariables();
    }
  }, [isOpen, chainId, fetchVariables]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all variables have values
    const missingVariables = variables.filter(
      (variable) => !values[variable]?.trim(),
    );
    if (missingVariables.length > 0) {
      setError(`Please provide values for: ${missingVariables.join(", ")}`);
      return;
    }

    onSubmit(values);
    onClose();
  };

  const handleValueChange = (variable: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [variable]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Set Variables
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {chainName && (
            <p className="text-sm text-gray-600 mb-4">
              Chain: <span className="font-medium">{chainName}</span>
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a3e635]"></div>
            </div>
          ) : variables.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No variables found in this chain.</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                {variables.map((variable) => (
                  <div key={variable}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {variable}
                    </label>
                    <textarea
                      value={values[variable] || ""}
                      onChange={(e) =>
                        handleValueChange(variable, e.target.value)
                      }
                      placeholder={`Enter value for {{${variable}}}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#a3e635] focus:border-transparent"
                      required
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#a3e635] text-black rounded-md hover:bg-[#92d228] font-medium"
                >
                  Run Chain
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
