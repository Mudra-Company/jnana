import React, { useState, useRef } from 'react';
import { Plus, Trash2, Database, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { JobDatabase } from '../../types';
import { toast } from '../../src/hooks/use-toast';

interface JobDatabaseEditorProps {
  jobDb: JobDatabase;
  onUpdateJobDb: (db: JobDatabase) => void;
}

export const JobDatabaseEditor: React.FC<JobDatabaseEditorProps> = ({ jobDb, onUpdateJobDb }) => {
    const [selectedCode, setSelectedCode] = useState<string | null>(Object.keys(jobDb)[0] || null);
    const [newJobTitle, setNewJobTitle] = useState('');
    const [newJobSector, setNewJobSector] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleExport = () => {
        const rows: { RIASEC_CODE: string; JOB_TITLE: string; SECTOR: string }[] = [];
        
        Object.entries(jobDb).forEach(([code, jobs]) => {
            (jobs as { title: string; sector: string }[]).forEach(job => {
                rows.push({
                    RIASEC_CODE: code,
                    JOB_TITLE: job.title,
                    SECTOR: job.sector
                });
            });
        });
        
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Jobs');
        XLSX.writeFile(wb, 'job_database_export.xlsx');
        
        toast({ title: "Export completato", description: `Esportati ${rows.length} profili professionali` });
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json<{ RIASEC_CODE: string; JOB_TITLE: string; SECTOR: string }>(sheet);
                
                const newJobDb: JobDatabase = {};
                let importedCount = 0;
                
                rows.forEach(row => {
                    const code = row.RIASEC_CODE?.toString().trim().toUpperCase();
                    const title = row.JOB_TITLE?.toString().trim();
                    const sector = row.SECTOR?.toString().trim() || 'Generico';
                    
                    if (code && title) {
                        if (!newJobDb[code]) newJobDb[code] = [];
                        newJobDb[code].push({ title, sector });
                        importedCount++;
                    }
                });
                
                if (importedCount > 0) {
                    onUpdateJobDb(newJobDb);
                    toast({ title: "Import completato", description: `Importati ${importedCount} profili in ${Object.keys(newJobDb).length} codici RIASEC` });
                } else {
                    toast({ title: "Nessun dato valido", description: "Il file non contiene dati validi da importare", variant: "destructive" });
                }
            } catch (error) {
                toast({ title: "Errore di import", description: "Formato file non valido", variant: "destructive" });
            }
            
            e.target.value = '';
        };
        
        reader.readAsBinaryString(file);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImport}
                accept=".xlsx,.xls"
                className="hidden"
            />
            
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-brand font-bold text-gray-900 dark:text-white">Database Profili & Lavori</h1>
                    <p className="text-gray-600 dark:text-gray-400">Mappatura dei codici RIASEC ai job title.</p>
                </div>
                
                <div className="flex gap-2">
                    <Button onClick={handleExport} variant="secondary" className="flex items-center gap-2">
                        <Download size={16} /> Esporta Excel
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="flex items-center gap-2">
                        <Upload size={16} /> Importa Excel
                    </Button>
                </div>
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