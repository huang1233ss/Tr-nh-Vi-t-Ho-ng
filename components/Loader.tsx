
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      <p className="text-white text-xl mt-4 font-semibold text-center px-4">
        AI đang chấm bài của bạn...<br/>
        Quá trình này có thể mất một lúc đối với các văn bản dài.
      </p>
    </div>
  );
};

export default Loader;
