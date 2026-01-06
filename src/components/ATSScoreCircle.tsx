import { cn } from "@/lib/utils";

interface ATSScoreCircleProps {
    score: number;
    improvements?: string[];
    isLoading?: boolean;
}

const ATSScoreCircle = ({ score, improvements = [], isLoading = false }: ATSScoreCircleProps) => {
    // Calculate dash array for SVG circle
    // r = 40, circumference = 2 * pi * 40 ≈ 251.2
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(score, 0), 100);
    const dashoffset = circumference - (progress / 100) * circumference;

    // Determine color based on score
    const getColor = (val: number) => {
        if (val >= 80) return "text-green-500";
        if (val >= 50) return "text-blue-500";
        return "text-orange-500";
    };

    const strokeColor = getColor(score);

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex flex-col items-center justify-center flex-shrink-0 mb-6">
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">ATS Score</h3>
                <div className="relative w-32 h-32">
                    {/* Background Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            fill="transparent"
                            className="stroke-slate-200 dark:stroke-slate-700"
                            strokeWidth="12"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            fill="transparent"
                            className={cn("transition-all duration-1000 ease-out", strokeColor)}
                            strokeWidth="12"
                            stroke="currentColor"
                            strokeDasharray={circumference}
                            strokeDashoffset={isLoading ? circumference : dashoffset}
                            strokeLinecap="round"
                        />
                    </svg>
                    {/* Text in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn("text-2xl font-bold", "text-slate-900 dark:text-white")}>
                            {isLoading ? "-" : `${Math.round(score)}%`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <h4 className="text-sm font-semibold mb-2 text-slate-900 dark:text-white px-1">Improvements</h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 max-h-[160px] overflow-y-auto custom-scrollbar">
                    {improvements.length > 0 ? (
                        <ul className="space-y-2">
                            {improvements.map((item, idx) => (
                                <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start">
                                    <span className="mr-2 mt-1 block w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-slate-500 italic">
                            {isLoading ? "Analyzing..." : "No specific improvements found."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ATSScoreCircle;
