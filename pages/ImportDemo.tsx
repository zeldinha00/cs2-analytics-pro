import React, { useState, useRef, useEffect } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Loader2, Server } from 'lucide-react';
import { ProcessingStatus, Match } from '../types';
import { processDemoFile, checkBackendHealth } from '../services/demoParser';
import supabaseService from '../services/supabaseService';

interface ImportDemoProps {
  onImportMatch: (match: Match) => void;
}

const ImportDemo: React.FC<ImportDemoProps> = ({ onImportMatch }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<ProcessingStatus[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileQueueRef = useRef<File[]>([]);
  const partialMatchesRef = useRef<Map<string, { parts: Match[], totalParts: number }>>(new Map());

  // Verificar se backend está online ao carregar
  useEffect(() => {
    checkBackendHealth().then(setBackendOnline);
  }, []);

  // Processar fila de arquivos sequencialmente
  useEffect(() => {
    if (!isProcessing && fileQueueRef.current.length > 0) {
      const nextFile = fileQueueRef.current.shift();
      if (nextFile) {
        setIsProcessing(true);
        const id = Date.now().toString() + Math.random().toString();
        
        // Add to queue
        setQueue(prev => [{
          id,
          filename: nextFile.name,
          progress: 0,
          status: 'uploading'
        }, ...prev]);

        handleFileProcessing(nextFile, id);
      }
    }
  }, [isProcessing]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const filesArray = Array.from(files);
    
    // Agrupar arquivos por partida (detectar partes -p1, -p2, -p3)
    const matchGroups = new Map<string, File[]>();
    
    filesArray.forEach(file => {
      const match = file.name.match(/^(.+)-p(\d+)\.dem$/);
      if (match) {
        // É uma parte de uma partida
        const baseName = match[1];
        if (!matchGroups.has(baseName)) {
          matchGroups.set(baseName, []);
        }
        matchGroups.get(baseName)!.push(file);
      } else {
        // É uma demo normal (única)
        fileQueueRef.current.push(file);
      }
    });
    
    // Ordenar partes e adicionar à fila como grupos
    matchGroups.forEach((parts, baseName) => {
      // Ordenar partes por número (p1, p2, p3...)
      parts.sort((a, b) => {
        const numA = parseInt(a.name.match(/-p(\d+)\.dem$/)?.[1] || '0');
        const numB = parseInt(b.name.match(/-p(\d+)\.dem$/)?.[1] || '0');
        return numA - numB;
      });
      
      // Adicionar todas as partes sequencialmente
      parts.forEach(part => {
        fileQueueRef.current.push(part);
      });
    });

    // Iniciar processamento se ainda não está em andamento
    if (!isProcessing) {
      setIsProcessing(true);
      const nextFile = fileQueueRef.current.shift();
      if (nextFile) {
        const id = Date.now().toString() + Math.random().toString();
        
        // Add to queue
        setQueue(prev => [{
          id,
          filename: nextFile.name,
          progress: 0,
          status: 'uploading'
        }, ...prev]);

        handleFileProcessing(nextFile, id);
      }
    }
  };

  const handleFileProcessing = async (file: File, id: string) => {
    // Stage 1: Fake Upload Progress
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += 10;
      setQueue(prev => prev.map(q => q.id === id ? { ...q, progress: Math.min(progress, 90) } : q));
      
      if (progress >= 100) {
        clearInterval(uploadInterval);
        startParsing(file, id);
      }
    }, 100);
  };

  const startParsing = async (file: File, id: string) => {
    // Update status to processing
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'processing', progress: 50 } : q));

    try {
      // Call the service that reads the actual binary file
      const matchData = await processDemoFile(file, id);
      
      // Verificar se é uma parte de uma partida (pattern: nome-p1.dem, nome-p2.dem)
      const partMatch = file.name.match(/^(.+)-p(\d+)\.dem$/);
      
      if (partMatch) {
        const baseName = partMatch[1];
        const partNumber = parseInt(partMatch[2]);
        
        // Armazenar esta parte
        if (!partialMatchesRef.current.has(baseName)) {
          partialMatchesRef.current.set(baseName, { parts: [], totalParts: 0 });
        }
        
        const partialMatch = partialMatchesRef.current.get(baseName)!;
        partialMatch.parts[partNumber - 1] = matchData;
        
        // Detectar total de partes procurando na fila de arquivos
        const remainingParts = fileQueueRef.current.filter(f => f.name.startsWith(baseName + '-p'));
        const currentParts = Array.from(partialMatchesRef.current.get(baseName)!.parts).filter(p => p);
        partialMatch.totalParts = remainingParts.length + currentParts.length;
        
        // Verificar se todas as partes foram processadas
        const allPartsProcessed = partialMatch.parts.filter(p => p).length === partialMatch.totalParts;
        
        if (allPartsProcessed) {
          // Combinar todas as partes em uma única partida
          const combinedMatch = combineMatchParts(partialMatch.parts.filter(p => p));
          
          // Verificar duplicatas
          const isDuplicate = await checkDuplicate(combinedMatch);
          
          if (isDuplicate) {
            throw new Error(
              `Demo duplicada: ${combinedMatch.teamA.name} vs ${combinedMatch.teamB.name} em ${combinedMatch.mapName} (${combinedMatch.date}) já existe no sistema`
            );
          }
          
          // Salvar partida combinada
          const savedId = await supabaseService.createMatch(combinedMatch);
          
          if (savedId) {
            setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'completed', progress: 100 } : q));
            onImportMatch(combinedMatch);
            
            // Limpar dados parciais
            partialMatchesRef.current.delete(baseName);
            setIsProcessing(false);
          } else {
            throw new Error('Falha ao salvar no banco de dados');
          }
        } else {
          // Ainda há partes a processar
          setQueue(prev => prev.map(q => q.id === id ? { 
            ...q, 
            status: 'completed', 
            progress: 100,
            errorMessage: `Parte ${partNumber}/${partialMatch.totalParts} processada`
          } : q));
          setIsProcessing(false);
        }
      } else {
        // Demo normal (não é parte de uma partida)
        const isDuplicate = await checkDuplicate(matchData);
        
        if (isDuplicate) {
          throw new Error(
            `Demo duplicada: ${matchData.teamA.name} vs ${matchData.teamB.name} em ${matchData.mapName} (${matchData.date}) já existe no sistema`
          );
        }
        
        // Save to Supabase
        const savedId = await supabaseService.createMatch(matchData);
        
        if (savedId) {
          // Verificar quantos rounds foram salvos
          let savedRounds = 0;
          try {
            savedRounds = await supabaseService.getRoundCount(savedId);
          } catch {}

          setQueue(prev => prev.map(q => q.id === id ? { 
            ...q, 
            status: 'completed', 
            progress: 100,
            errorMessage: savedRounds > 0 ? `Salvo com ${savedRounds} rounds` : 'Atenção: nenhum round salvo'
          } : q));

          onImportMatch(matchData);
          setIsProcessing(false);
        } else {
          throw new Error('Falha ao salvar no banco de dados');
        }
      }
      
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || 'Erro desconhecido';
      setQueue(prev => prev.map(q => q.id === id ? { 
        ...q, 
        status: 'error', 
        progress: 0,
        errorMessage: errorMessage
      } : q));
      
      // Processar próximo arquivo na fila mesmo em caso de erro
      setIsProcessing(false);
    }
  };

  const checkDuplicate = async (matchData: Match): Promise<boolean> => {
    const existingMatches = await supabaseService.getAllMatches();
    
    const normalizeTeamName = (name: string) => name.toLowerCase().trim();
    const normalizeMapName = (name: string) => name.toLowerCase().trim();
    
    const newTeamA = normalizeTeamName(matchData.teamA.name);
    const newTeamB = normalizeTeamName(matchData.teamB.name);
    const newDate = matchData.date;
    const newMap = normalizeMapName(matchData.mapName);
    
    return existingMatches.some(m => {
      const existingTeamA = normalizeTeamName(m.teamA.name);
      const existingTeamB = normalizeTeamName(m.teamB.name);
      const existingDate = m.date;
      const existingMap = normalizeMapName(m.mapName);
      
      const sameTeams = (
        (existingTeamA === newTeamA && existingTeamB === newTeamB) ||
        (existingTeamA === newTeamB && existingTeamB === newTeamA)
      );
      
      return sameTeams && existingDate === newDate && existingMap === newMap;
    });
  };

  const combineMatchParts = (parts: Match[]): Match => {
    if (parts.length === 0) throw new Error('Nenhuma parte para combinar');
    if (parts.length === 1) return parts[0];
    
    // Usar a primeira parte como base
    const combined = { ...parts[0] };
    
    // Combinar rounds de todas as partes e renumerar sequencialmente
    combined.rounds = [];
    let roundNumber = 1;
    
    parts.forEach(part => {
      part.rounds.forEach(round => {
        // Criar novo round sem ID (Supabase vai gerar novo)
        const newRound = { ...round };
        delete newRound.id; // Remover ID antigo para evitar conflito
        newRound.number = roundNumber++; // Renumerar sequencialmente
        combined.rounds.push(newRound);
      });
    });
    
    // Recalcular scores totais
    let teamAScore = 0;
    let teamBScore = 0;
    
    combined.rounds.forEach(round => {
      if (round.winnerSide === combined.teamA.side) {
        teamAScore++;
      } else {
        teamBScore++;
      }
    });
    
    // Recalcular parciais (halves) baseado nos novos números dos rounds
    // Função para determinar qual é o lado de um time em um round específico
    const getTeamSideInRound = (teamInitialSide: string, roundNumber: number): string => {
      const HALF_LENGTH = 12;
      if (roundNumber <= HALF_LENGTH) {
        // Primeiro tempo: mantém lado inicial
        return teamInitialSide;
      } else if (roundNumber <= HALF_LENGTH * 2) {
        // Segundo tempo: troca de lado
        return teamInitialSide === 'CT' ? 'T' : 'CT';
      } else {
        // OT: troca a cada 3 rounds
        const otRoundIndex = roundNumber - (HALF_LENGTH * 2) - 1; // 0-based
        const otPeriod = Math.floor(otRoundIndex / 3); // qual período (0, 1, 2, ...)
        const sidesSwapped = otPeriod % 2 === 1;
        // Período par (0, 2, 4...): mantém lado do 2º tempo
        // Período ímpar (1, 3, 5...): troca do lado do 2º tempo
        const secondHalfSide = teamInitialSide === 'CT' ? 'T' : 'CT';
        return sidesSwapped ? teamInitialSide : secondHalfSide;
      }
    };

    const HALF_LENGTH = 12;
    let teamA_first_half = 0;
    let teamB_first_half = 0;
    let teamA_second_half = 0;
    let teamB_second_half = 0;
    let teamA_ot = 0;
    let teamB_ot = 0;

    combined.rounds.forEach(round => {
      const teamASideInRound = getTeamSideInRound(combined.teamA.side, round.number);
      const isTeamAWinner = round.winnerSide === teamASideInRound;
      
      if (round.number <= HALF_LENGTH) {
        isTeamAWinner ? teamA_first_half++ : teamB_first_half++;
      } else if (round.number <= HALF_LENGTH * 2) {
        isTeamAWinner ? teamA_second_half++ : teamB_second_half++;
      } else {
        isTeamAWinner ? teamA_ot++ : teamB_ot++;
      }
    });
    
    combined.teamA.score = teamAScore;
    combined.teamB.score = teamBScore;
    
    // Determinar vencedor final
    if (teamAScore > teamBScore) {
      combined.winner = combined.teamA.side;
    } else if (teamBScore > teamAScore) {
      combined.winner = combined.teamB.side;
    }
    
    return combined;
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white">Importar Demos</h1>
        <p className="text-slate-400 text-sm">Faça upload de arquivos .dem para análise completa. O backend irá extrair todos os dados reais da partida.</p>
      </div>

      {/* Backend Status */}
      {backendOnline !== null && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          backendOnline 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <Server className="w-5 h-5" />
          <div className="flex-1">
            <div className="font-medium">
              {backendOnline ? '✅ Backend Online' : '❌ Backend Offline'}
            </div>
            <div className="text-sm opacity-80">
              {backendOnline 
                ? 'Parser de demos pronto para processar arquivos' 
                : 'Execute: cd backend && npm run dev'}
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
          flex flex-col items-center justify-center gap-4 group
          ${isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-slate-700 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-900/60'}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".dem" 
          multiple 
          onChange={(e) => handleFiles(e.target.files)} 
        />
        
        <div className={`p-4 rounded-full bg-slate-800 group-hover:scale-110 transition-transform duration-300 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`}>
          <Upload size={40} />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-white">Clique ou arraste arquivos aqui</h3>
          <p className="text-slate-400 mt-1">Suporta arquivos .dem (CS2)</p>
          <p className="text-slate-500 text-xs mt-2">Exemplo: liquid-vs-falcons-m1-nuke.dem</p>
        </div>
      </div>

      {/* Queue List */}
      {queue.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60">
            <h3 className="font-semibold text-white">Fila de Processamento</h3>
          </div>
          <div className="divide-y divide-slate-700/50">
            {queue.map((item) => (
              <div key={item.id} className="p-4 flex items-center gap-4">
                <div className="p-2 bg-slate-800 rounded text-slate-400">
                  <File size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-slate-200 truncate">{item.filename}</span>
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                      {item.status === 'uploading' && 'ENVIANDO'}
                      {item.status === 'processing' && 'PROCESSANDO'}
                      {item.status === 'completed' && 'CONCLUÍDO'}
                      {item.status === 'error' && 'ERRO'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  {(item.status === 'uploading' || item.status === 'processing') && (
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${item.status === 'processing' ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="text-xs text-red-400 mt-1">
                      {item.errorMessage || 'Falha ao processar demo.'}
                    </div>
                  )}
                </div>

                <div className="w-8 flex justify-center">
                  {item.status === 'completed' && <CheckCircle className="text-green-500" size={20} />}
                  {item.status === 'error' && <AlertCircle className="text-red-500" size={20} />}
                  {(item.status === 'uploading' || item.status === 'processing') && (
                    <Loader2 className="text-blue-500 animate-spin" size={20} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportDemo;
