import React, { useState, useRef } from 'react';
import {
  Upload, FileText, Image, Award, Briefcase, Trash2, 
  ExternalLink, GripVertical, Plus, X, Loader2, Sparkles
} from 'lucide-react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import type { PortfolioItem, PortfolioItemType, ParsedCVData } from '../../types/karma';
import { supabase } from '../../integrations/supabase/client';

interface PortfolioManagerProps {
  items: PortfolioItem[];
  onAddItem: (item: Omit<PortfolioItem, 'id' | 'userId' | 'createdAt'>) => Promise<any>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onUploadFile: (file: File, itemType: PortfolioItemType) => Promise<string | null>;
  onCVParsed?: (data: ParsedCVData) => void;
  userId: string;
}

const ITEM_TYPE_CONFIG: Record<PortfolioItemType, { label: string; icon: React.ElementType; accept: string }> = {
  cv: { label: 'CV / Curriculum', icon: FileText, accept: '.pdf,.doc,.docx,image/*' },
  certificate: { label: 'Certificazione', icon: Award, accept: '.pdf,.jpg,.jpeg,.png,image/*' },
  project: { label: 'Progetto', icon: Briefcase, accept: '.pdf,.jpg,.jpeg,.png,.zip,image/*' },
  image: { label: 'Immagine', icon: Image, accept: 'image/*' },
};

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onUploadFile,
  onCVParsed,
  userId,
}) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedType, setSelectedType] = useState<PortfolioItemType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    externalUrl: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const parseCV = async (file: File): Promise<ParsedCVData | null> => {
    try {
      setIsParsing(true);
      
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await supabase.functions.invoke('cv-parser', {
        body: {
          fileBase64: base64,
          fileType: file.type,
          fileName: file.name,
        },
      });

      if (response.error) {
        console.error('CV parsing error:', response.error);
        return null;
      }

      return response.data?.data || null;
    } catch (error) {
      console.error('CV parsing failed:', error);
      return null;
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedType || !newItem.title.trim()) return;

    setIsUploading(true);
    try {
      let fileUrl: string | undefined;
      
      // Upload file if selected
      if (selectedFile) {
        fileUrl = await onUploadFile(selectedFile, selectedType) || undefined;
        
        // If it's a CV, offer to parse it
        if (selectedType === 'cv' && onCVParsed) {
          const parsedData = await parseCV(selectedFile);
          if (parsedData) {
            onCVParsed(parsedData);
          }
        }
      }

      await onAddItem({
        itemType: selectedType,
        title: newItem.title.trim(),
        description: newItem.description.trim() || undefined,
        fileUrl,
        externalUrl: newItem.externalUrl.trim() || undefined,
        sortOrder: items.length,
      });

      // Reset form
      setIsAddingItem(false);
      setSelectedType(null);
      setNewItem({ title: '', description: '', externalUrl: '' });
      setSelectedFile(null);
      setFilePreview(null);
    } catch (error) {
      console.error('Failed to add portfolio item:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelAdd = () => {
    setIsAddingItem(false);
    setSelectedType(null);
    setNewItem({ title: '', description: '', externalUrl: '' });
    setSelectedFile(null);
    setFilePreview(null);
  };

  const getItemIcon = (type: PortfolioItemType) => {
    const Icon = ITEM_TYPE_CONFIG[type].icon;
    return <Icon size={20} />;
  };

  const groupedItems = {
    cv: items.filter(i => i.itemType === 'cv'),
    certificate: items.filter(i => i.itemType === 'certificate'),
    project: items.filter(i => i.itemType === 'project'),
    image: items.filter(i => i.itemType === 'image'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">Portfolio</h3>
        {!isAddingItem && (
          <Button variant="secondary" size="sm" onClick={() => setIsAddingItem(true)}>
            <Plus size={16} className="mr-1" />
            Aggiungi
          </Button>
        )}
      </div>

      {/* Add New Item Form */}
      {isAddingItem && (
        <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
          {!selectedType ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">Seleziona il tipo di elemento:</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(ITEM_TYPE_CONFIG) as [PortfolioItemType, typeof ITEM_TYPE_CONFIG[PortfolioItemType]][]).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <config.icon size={20} />
                    </div>
                    <span className="font-medium text-foreground">{config.label}</span>
                  </button>
                ))}
              </div>
              <Button variant="secondary" size="sm" onClick={handleCancelAdd} className="mt-2">
                Annulla
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getItemIcon(selectedType)}
                  <span className="font-medium text-foreground">
                    {ITEM_TYPE_CONFIG[selectedType].label}
                  </span>
                </div>
                <button onClick={handleCancelAdd} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder={selectedType === 'cv' ? 'Il mio CV' : 'Titolo del progetto'}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Descrizione
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                  placeholder="Breve descrizione..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ITEM_TYPE_CONFIG[selectedType].accept}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText size={20} className="text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2"
                  >
                    <Upload size={24} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Clicca per caricare un file</span>
                  </button>
                )}
              </div>

              {/* CV Parsing Notice */}
              {selectedType === 'cv' && selectedFile && onCVParsed && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl text-sm">
                  <Sparkles size={16} className="text-primary" />
                  <span className="text-foreground">
                    Il CV verrà analizzato con AI per estrarre automaticamente le tue informazioni
                  </span>
                </div>
              )}

              {/* External URL */}
              {(selectedType === 'project' || selectedType === 'certificate') && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Link esterno (opzionale)
                  </label>
                  <input
                    type="url"
                    value={newItem.externalUrl}
                    onChange={(e) => setNewItem({ ...newItem, externalUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="https://..."
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleAddItem}
                  disabled={!newItem.title.trim() || isUploading || isParsing}
                  className="flex-1"
                >
                  {isUploading || isParsing ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      {isParsing ? 'Analisi CV...' : 'Caricamento...'}
                    </>
                  ) : (
                    'Aggiungi'
                  )}
                </Button>
                <Button variant="secondary" onClick={handleCancelAdd}>
                  Annulla
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Existing Items */}
      {items.length === 0 && !isAddingItem ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p>Nessun elemento nel portfolio</p>
          <p className="text-sm">Aggiungi il tuo CV, certificazioni o progetti</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* CV Section */}
          {groupedItems.cv.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <FileText size={14} />
                Curriculum Vitae
              </h4>
              <div className="space-y-2">
                {groupedItems.cv.map(item => (
                  <PortfolioItemCard key={item.id} item={item} onRemove={onRemoveItem} />
                ))}
              </div>
            </div>
          )}

          {/* Certifications Section */}
          {groupedItems.certificate.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Award size={14} />
                Certificazioni
              </h4>
              <div className="space-y-2">
                {groupedItems.certificate.map(item => (
                  <PortfolioItemCard key={item.id} item={item} onRemove={onRemoveItem} />
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {groupedItems.project.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Briefcase size={14} />
                Progetti
              </h4>
              <div className="space-y-2">
                {groupedItems.project.map(item => (
                  <PortfolioItemCard key={item.id} item={item} onRemove={onRemoveItem} />
                ))}
              </div>
            </div>
          )}

          {/* Images Section */}
          {groupedItems.image.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Image size={14} />
                Immagini
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {groupedItems.image.map(item => (
                  <PortfolioItemCard key={item.id} item={item} onRemove={onRemoveItem} isImage />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Individual Item Card Component
interface PortfolioItemCardProps {
  item: PortfolioItem;
  onRemove: (id: string) => Promise<void>;
  isImage?: boolean;
}

const PortfolioItemCard: React.FC<PortfolioItemCardProps> = ({ item, onRemove, isImage }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(item.id);
    } finally {
      setIsRemoving(false);
    }
  };

  const Icon = ITEM_TYPE_CONFIG[item.itemType].icon;

  if (isImage && item.fileUrl) {
    return (
      <div className="relative group rounded-xl overflow-hidden aspect-square">
        <img
          src={item.fileUrl}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-white text-sm truncate">{item.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-xl group">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <Icon size={18} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h5 className="font-medium text-foreground truncate">{item.title}</h5>
        {item.description && (
          <p className="text-sm text-muted-foreground truncate">{item.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {item.fileUrl && (
          <a
            href={item.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10"
          >
            <ExternalLink size={16} />
          </a>
        )}
        {item.externalUrl && (
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10"
          >
            <ExternalLink size={16} />
          </a>
        )}
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
        >
          {isRemoving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      </div>
    </div>
  );
};

export default PortfolioManager;
