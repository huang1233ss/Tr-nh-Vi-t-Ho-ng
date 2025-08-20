
import React from 'react';
import type { AnalysisResult, ComparisonResult } from '../types';

interface ResultDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onReset }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderComparison = (item: ComparisonResult, index: number) => {
    switch (item.status) {
      case 'correct':
        return <span key={index} className="text-green-600 bg-green-100 rounded px-1">{item.userChar}</span>;
      case 'incorrect':
        const tooltipContent = item.explanation 
          ? `Đúng: ${item.correctChar} | Vì sao: ${item.explanation}`
          : `Phải là: ${item.correctChar}`;
        return (
          <span key={index} className="text-red-600 bg-red-100 rounded px-1 relative group cursor-pointer">
            {item.userChar}
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-xs px-3 py-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 text-left">
              {tooltipContent}
            </span>
          </span>
        );
      case 'missing':
        return (
          <span key={index} className="text-red-600 bg-red-100 rounded px-1 underline decoration-dotted" title={`Thiếu ký tự: ${item.correctChar}`}>
            {/* Using a placeholder to show where the character should be */}
            <span className="opacity-50">{item.correctChar}</span>
          </span>
        );
      case 'extra':
        return <span key={index} className="text-gray-500 bg-gray-200 rounded px-1 line-through">{item.userChar}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-800">Đã Chấm Xong</h2>
      
      <div className="relative w-48 h-48">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
          <circle
            className={getScoreColor(result.score)}
            strokeWidth="10"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={(2 * Math.PI * 45) * (1 - result.score / 100)}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-5xl font-bold ${getScoreColor(result.score)}`}>
          {result.score}
          <span className="text-2xl mt-1">%</span>
        </div>
      </div>

      <div className="w-full p-6 border rounded-lg bg-white shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Phân Tích Chi Tiết</h3>
        <div className="text-2xl leading-relaxed font-serif p-4 bg-gray-50 rounded-md whitespace-pre-wrap break-words">
          {result.comparison.map(renderComparison)}
        </div>
      </div>
      
      <button
        onClick={onReset}
        className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform transform hover:scale-105"
      >
        <i className="fas fa-redo mr-2"></i>Thử Bài Chính Tả Khác
      </button>
    </div>
  );
};

export default ResultDisplay;
