import { Sparkles, TrendingUp, ShieldCheck } from "lucide-react";

const PROMPTS = [
  { label: "Best funds for long term", icon: TrendingUp },
  { label: "Compare HDFC vs SBI funds", icon: Sparkles },
  { label: "Low risk investment options", icon: ShieldCheck },
];

const EmptyState = ({ onPrompt }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full mt-16 space-y-8">

      {/* Icon + text */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl 
          bg-blue-100 dark:bg-blue-600/20 
          flex items-center justify-center mx-auto mb-4"
        >
          <Sparkles size={22} className="text-blue-600 dark:text-blue-400" />
        </div>

        <p className="font-semibold text-base text-gray-900 dark:text-white">
          How can I help you today?
        </p>

        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Ask me anything about mutual funds
        </p>
      </div>

      {/* Prompt cards */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {PROMPTS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => onPrompt(label)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl
              bg-gray-100 dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              hover:bg-gray-200 dark:hover:bg-gray-700
              transition-all duration-200 group text-left"
          >
            <div className="w-8 h-8 rounded-lg 
              bg-blue-100 dark:bg-blue-600/20 
              flex items-center justify-center flex-shrink-0"
            >
              <Icon size={14} className="text-blue-600 dark:text-blue-400" />
            </div>

            <span className="text-sm 
              text-gray-700 dark:text-gray-300 
              group-hover:text-gray-900 dark:group-hover:text-white 
              transition-colors"
            >
              {label}
            </span>
          </button>
        ))}
      </div>

    </div>
  );
};

export default EmptyState;