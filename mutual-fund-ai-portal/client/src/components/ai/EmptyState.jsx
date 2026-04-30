const EmptyState = ({ onPrompt }) => {
  const prompts = [
    "Best funds for long term",
    "Compare HDFC vs SBI funds",
    "Low risk investment options",
  ];

  return (
    <div className="text-center text-gray-400 mt-10 space-y-5">
      <div>
        <p>No messages yet.</p>
        <p className="text-sm">Ask something to get started.</p>
      </div>

      {/* 🔥 Prompt buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onPrompt(p)}
            className="text-xs px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 hover:text-white transition"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmptyState;