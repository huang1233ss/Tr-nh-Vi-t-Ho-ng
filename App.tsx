
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AppState } from './types';
import type { AnalysisResult } from './types';
import { analyzeDictation } from './services/geminiService';
import Loader from './components/Loader';
import ResultDisplay from './components/ResultDisplay';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [correctTranscript, setCorrectTranscript] = useState<string>('');
  const [userDictation, setUserDictation] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, appState]);

  const audioUrl = useMemo(() => {
    if (audioFile) {
      return URL.createObjectURL(audioFile);
    }
    return null;
  }, [audioFile]);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const supportedExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
      const isSupported = file.type.startsWith('audio/') || supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (isSupported) {
        setAudioFile(file);
        setError(null);
      } else {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioFile(null);
        setError('Vui lòng tải lên một tệp âm thanh hợp lệ (MP3, WAV, OGG, M4A).');
      }
    } 
  };

  const handleStartDictation = () => {
    if (!audioFile) {
      setError('Vui lòng tải lên một tệp âm thanh.');
      return;
    }
    if (correctTranscript.trim() === '') {
      setError('Vui lòng cung cấp bản ghi chính xác.');
      return;
    }
    setError(null);
    setAppState(AppState.DICTATION);
  };
  
  const handleSubmit = useCallback(async () => {
    if (userDictation.trim() === '') {
        setError("Vui lòng gõ những gì bạn nghe được trước khi nộp bài.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeDictation(correctTranscript, userDictation);
      setAnalysisResult(result);
      setAppState(AppState.RESULT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoading(false);
    }
  }, [correctTranscript, userDictation]);

  const handleReset = () => {
    setAppState(AppState.SETUP);
    if(audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null);
    setCorrectTranscript('');
    setUserDictation('');
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
  };

  const renderSetup = () => (
    <div className="w-full space-y-6 animate-fade-in">
        <h2 className="text-3xl font-bold text-gray-800 text-center">Thiết Lập Bài Chính Tả</h2>
        <div className="p-6 border rounded-lg bg-white shadow-md">
            <label className="block text-lg font-semibold text-gray-700 mb-2" htmlFor="audio-upload">
                <i className="fas fa-upload mr-2 text-blue-500"></i>1. Tải Lên Tệp Âm Thanh
            </label>
            <input 
                id="audio-upload"
                type="file" 
                accept="audio/*,.mp3,.m4a,.wav,.ogg" 
                onChange={handleAudioChange} 
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {audioFile && <p className="text-sm text-green-600 mt-2"><i className="fas fa-check-circle mr-1"></i>{audioFile.name}</p>}
            {audioUrl && (
                <div className="mt-4 space-y-4">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Nghe thử âm thanh:</p>
                    <audio ref={audioRef} key={audioUrl} controls src={audioUrl} className="w-full h-10 rounded-md">
                        Trình duyệt của bạn không hỗ trợ phần tử âm thanh.
                    </audio>
                    <div className="flex items-center space-x-3">
                      <label htmlFor="speed-control-setup" className="font-semibold text-gray-700 whitespace-nowrap">
                        <i className="fas fa-tachometer-alt mr-2 text-blue-500"></i>Tốc độ phát:
                      </label>
                      <select
                        id="speed-control-setup"
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                        className="block w-full max-w-[150px] py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                      >
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1">1x (Thường)</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                      </select>
                    </div>
                </div>
            )}
        </div>

        <div className="p-6 border rounded-lg bg-white shadow-md">
            <label className="block text-lg font-semibold text-gray-700 mb-2" htmlFor="transcript-input">
                <i className="fas fa-file-alt mr-2 text-blue-500"></i>2. Dán Bản Ghi Chính Xác
            </label>
            <textarea
                id="transcript-input"
                value={correctTranscript}
                onChange={(e) => setCorrectTranscript(e.target.value)}
                placeholder="Dán toàn bộ văn bản tiếng Trung chính xác vào đây. Nội dung này sẽ được ẩn trong khi làm bài."
                rows={10}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white text-black"
            />
        </div>

        <button
            onClick={handleStartDictation}
            disabled={!audioFile || correctTranscript.trim() === ''}
            className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
        >
            Bắt Đầu Viết Chính Tả
        </button>
    </div>
  );

  const renderDictation = () => (
    <div className="w-full space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-800 text-center">Nghe và Gõ</h2>
      <div className="p-4 border rounded-lg bg-white shadow-md space-y-4">
        {audioUrl && (
          <audio ref={audioRef} controls src={audioUrl} className="w-full rounded-lg">
            Trình duyệt của bạn không hỗ trợ phần tử âm thanh.
          </audio>
        )}
        <div className="flex items-center space-x-3">
          <label htmlFor="speed-control-dictation" className="font-semibold text-gray-700 whitespace-nowrap">
            <i className="fas fa-tachometer-alt mr-2 text-blue-500"></i>Tốc độ phát:
          </label>
          <select
            id="speed-control-dictation"
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className="block w-full max-w-[150px] py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x (Thường)</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>
      <textarea
        value={userDictation}
        onChange={(e) => setUserDictation(e.target.value)}
        placeholder="Gõ văn bản tiếng Trung bạn nghe được từ âm thanh..."
        rows={15}
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-serif text-lg bg-white text-black"
      />
      <div className="flex space-x-4">
        <button
          onClick={handleReset}
          className="w-1/3 py-3 px-6 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <i className="fas fa-arrow-left mr-2"></i>Quay Lại
        </button>
        <button
          onClick={handleSubmit}
          className="w-2/3 py-3 px-6 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-transform transform hover:scale-105"
        >
          <i className="fas fa-paper-plane mr-2"></i>Nộp Bài để Chấm Điểm
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (appState) {
      case AppState.SETUP:
        return renderSetup();
      case AppState.DICTATION:
        return renderDictation();
      case AppState.RESULT:
        return analysisResult && <ResultDisplay result={analysisResult} onReset={handleReset} />;
      default:
        return <p>Trạng thái không hợp lệ</p>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
            <i className="fas fa-headphones-alt text-blue-600 mr-3"></i>
            Luyện Chính Tả <span className="text-blue-600">Tiếng Trung với AI</span>
          </h1>
          <p className="mt-2 text-lg text-gray-600">Tải lên, nghe, gõ và nhận phản hồi tức thì từ AI.</p>
        </header>

        <main className="bg-slate-50 p-6 sm:p-8 rounded-xl shadow-2xl min-h-[400px] flex items-center justify-center">
          {isLoading && <Loader />}
          {error && (
            <div className="w-full text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Lỗi: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {!error && renderContent()}
        </main>
        
        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Phát triển bởi Google Gemini API</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
