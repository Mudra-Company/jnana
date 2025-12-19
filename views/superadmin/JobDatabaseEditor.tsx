import React, { useState } from 'react';
import { Plus, Trash2, Database } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { JobDatabase } from '../../types';

interface JobDatabaseEditorProps {
  jobDb: JobDatabase;
  onUpdateJobDb: (db: JobDatabase) => void;
}

export const JobDatabaseEditor: React.FC<JobDatabaseEditorProps> = ({ jobDb, onUpdateJobDb }) => {
    const [selectedCode, setSelectedCode] = useState<string | null>(Object.keys(jobDb)[0] || null);
    const [newJobTitle, setNewJobTitle] = useState('');
    const [newJobSector, setNewJobSector] = useState('');

    const handleAddJob = () => {
        if (!selectedCode || !newJobTitle.trim()) return;
        const currentJobs = jobDb[selectedCode] || [];
        const updatedJobs = [...currentJobs, { title: newJobTitle, sector: newJobSector || 'Generico' }];
        
        onUpdateJobDb({
            ...jobDb,
            [selectedCode]: updatedJobs
        });
        setNewJobTitle('');
        setNewJobSector('');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
             <div className="mb-8">
                <h1 className="text-3xl font-brand font-bold text-gray-900 dark:text-white">Database Profili & Lavori</h1>
                <p className="text-gray-600">Mappatura dei codici RIASEC ai job title.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <Card className="lg:col-span-1 max-h-[70vh] overflow-y-auto">
                    <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-300">Codici RIASEC</h3>
                    <div className="space-y-2">
                        {Object.keys(jobDb).sort().map(code => (
                            <div 
                                key={code} 
                                onClick={() => setSelectedCode(code)}
                                className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedCode === code ? 'bg-jnana-sage text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <span className="font-mono font-bold">{code}</span>
                                <span className="text-xs opacity-80 bg-white/20 px-2 py-0.5 rounded">{jobDb[code].length}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="lg:col-span-3">
                    {selectedCode ? (
                        <>
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl flex items-center gap-2">
                                    <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">{selectedCode}</span>
                                    <span className="text-gray-500 font-normal text-base">Profili professionali associati</span>
                                </h3>
                             </div>
                             
                             <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl mb-6 border border-gray-100 dark:border-gray-700">
                                 <h4 className="text-xs font-bold uppercase text-gray-500 mb-3">Aggiungi Nuovo Lavoro</h4>
                                 <div className="flex gap-2">
                                     <input 
                                        className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                        placeholder="Job Title (es. Project Manager)"
                                        value={newJobTitle}
                                        onChange={e => setNewJobTitle(e.target.value)}
                                     />
                                     <input 
                                        className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                        placeholder="Settore (es. IT)"
                                        value={newJobSector}
                                        onChange={e => setNewJobSector(e.target.value)}
                                     />
                                     <Button onClick={handleAddJob} size="sm"><Plus size={16}/></Button>
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {jobDb[selectedCode].map((job, idx) => (
                                     <div key={idx} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:shadow-md transition-shadow flex justify-between items-center group">
                                         <div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-200">{job.title}</h4>
                                            <p className="text-xs text-gray-500 uppercase">{job.sector}</p>
                                         </div>
                                         <button className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <Trash2 size={16} />
                                         </button>
                                     </div>
                                 ))}
                             </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Database size={48} className="mb-4 opacity-20"/>
                            <p>Seleziona un codice RIASEC per gestire i lavori.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};