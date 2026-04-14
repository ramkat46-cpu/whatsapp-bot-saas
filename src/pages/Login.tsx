export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { password });
      localStorage.setItem("token", res.data.token);
      nav("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 bg-white rounded-xl shadow w-80">
        <h2 className="text-xl mb-4">Login</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            type="password"
            className="w-full p-2 border mb-3"
            placeholder="Password"
            onChange={e => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#075E54] text-white p-2 rounded"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}