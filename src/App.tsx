import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface FileData {
  path: string;
  content: string;
}

// 재귀적으로 파일과 폴더를 탐색하여 파일을 읽어오는 함수
const getFilesFromEntry = async (entry: any, path: string, resultContext: { files: FileData[], limit: number }): Promise<void> => {
  if (resultContext.files.length >= resultContext.limit) return;
  
  // 불필요한 폴더 무시
  if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === 'dist' || entry.name === 'build' || entry.name === '.vscode') {
    return;
  }

  if (entry.isFile) {
    // 바이너리 파일이나 텍스트가 아닌 파일 무시
    const ext = entry.name.split('.').pop()?.toLowerCase();
    const ignoredExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'mp4', 'pdf', 'zip', 'tar', 'gz', 'woff', 'woff2', 'ttf', 'eot', 'lock'];
    if (ext && ignoredExts.includes(ext)) {
      return;
    }

    return new Promise((resolve) => {
      entry.file((file: File) => {
        // 2MB 이상 큰 파일은 무시
        if (file.size > 1024 * 1024 * 2) { 
           return resolve(); 
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (resultContext.files.length < resultContext.limit) {
            resultContext.files.push({ path: path + file.name, content: reader.result as string });
          }
          resolve();
        };
        reader.onerror = () => resolve();
        reader.readAsText(file);
      });
    });
  } else if (entry.isDirectory) {
    return new Promise((resolve) => {
      const dirReader = entry.createReader();
      const readEntries = () => {
        dirReader.readEntries(async (entries: any[]) => {
          if (entries.length === 0 || resultContext.files.length >= resultContext.limit) {
            resolve();
          } else {
            for (const en of entries) {
              if (resultContext.files.length >= resultContext.limit) break;
              await getFilesFromEntry(en, path + entry.name + '/', resultContext);
            }
            if (resultContext.files.length < resultContext.limit) {
               readEntries(); // 아직 읽을 항목이 남아있을 수 있으므로 계속 탐색
            } else {
               resolve();
            }
          }
        });
      };
      readEntries();
    });
  }
};

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [review, setReview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items) return;

    setIsLoading(true);
    try {
      const context: { files: FileData[], limit: number } = { files: [], limit: 10 };
      
      for (let i = 0; i < items.length; i++) {
        if (context.files.length >= context.limit) break;
        const item = items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            await getFilesFromEntry(entry, '', context);
          }
        }
      }

      if (context.files.length > 0) {
        const addedCode = context.files.map(f => `// --- File: ${f.path} ---\n${f.content}\n`).join('\n');
        setCode(prev => (prev ? `${prev}\n\n${addedCode}` : addedCode));
      } else {
        alert('읽을 수 있는 텍스트 파일이 없거나 제한을 초과했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleReviewCode = async () => {
    if (!code.trim()) {
      alert('코드를 입력해주세요!');
      return;
    }
    
    setIsLoading(true);
    setReview('');

    try {
      // Backend URL (for local testing port is 5000)
      const response = await fetch('http://localhost:5000/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '리뷰 요청에 실패했습니다.');
      }
      
      setReview(data.review);
    } catch (error: any) {
      console.error(error);
      setReview(`오류 발생: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full space-y-8">
        
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text">
            AI Code Reviewer
          </h1>
          <p className="mt-3 text-lg text-slate-400">
            드래그 앤 드롭으로 파일(폴더 포함)을 올려 코드 리뷰를 편하게 받아보세요 (최대 10개)
          </p>
        </div>

        {/* Main Content: Split View for Code Input and Review Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Panel: Code Input */}
          <div 
            className={`bg-slate-800 border-2 shadow-2xl rounded-2xl p-6 flex flex-col space-y-4 transition-all duration-300 relative ${
              isDragging ? 'border-blue-500 border-dashed bg-slate-800/80 scale-[1.02]' : 'border-slate-700 hover:border-slate-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Dragging Overlay UI */}
            {isDragging && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 rounded-2xl backdrop-blur-sm pointer-events-none">
                <div className="text-blue-400 text-2xl font-bold flex flex-col items-center">
                  <svg className="w-12 h-12 mb-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  여기에 파일을 놓아주세요!
                </div>
              </div>
            )}

            <div className="flex justify-between items-center relative z-0">
              <h2 className="text-xl font-semibold text-slate-200">코드 입력</h2>
              <select
                className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors cursor-pointer"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="php">PHP</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
              </select>
            </div>
            
            <textarea
              className="flex-grow min-h-[400px] bg-slate-900 text-green-400 font-mono text-sm p-4 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-slate-600 shadow-inner relative z-0"
              placeholder="코드를 붙여넣거나, 폴더/파일을 드래그해서 놓아주세요..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
            />
            
            <button
              onClick={handleReviewCode}
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 relative z-0
                ${isLoading 
                  ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-indigo-500/25'
                }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>처리 중...</span>
                </>
              ) : (
                <span>리뷰 요청하기 🚀</span>
              )}
            </button>
          </div>

          {/* Right Panel: Review Output */}
          <div className="bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl p-6 flex flex-col space-y-4 transition-all duration-300 hover:border-slate-600">
            <h2 className="text-xl font-semibold text-slate-200">리뷰 결과</h2>
            <div className={`flex-grow border border-slate-700 rounded-xl p-4 overflow-y-auto ${!review ? 'bg-slate-900/50 flex items-center justify-center' : 'bg-slate-900'} shadow-inner`}>
              {!review && !isLoading ? (
                <p className="text-slate-500 text-center">코드를 입력하고 리뷰를 요청하면<br/>이곳에 결과가 표시됩니다.</p>
              ) : (
                <div className="prose prose-invert max-w-none text-slate-300 font-sans leading-relaxed pointer-events-auto">
                  {/* For Markdown Support */}
                  <ReactMarkdown>
                    {review}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default App;
