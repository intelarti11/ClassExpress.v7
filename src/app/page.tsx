
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, type ChangeEvent, useEffect, type DragEvent } from "react";
import Link from "next/link";
import { UploadCloud, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedCsvData {
  headers: string[];
  rows: Record<string, string>[];
}

interface LevelStats {
  total: number;
  boys: number;
  girls: number;
  unspecifiedSex: number;
}

const PASTEL_COLORS = [
  { background: "hsl(340 100% 92%)", text: "hsl(340 60% 40%)" }, // Rose Pastel
  { background: "hsl(190 100% 90%)", text: "hsl(190 60% 40%)" }, // Bleu Ciel Pastel
  { background: "hsl(100 80% 90%)", text: "hsl(100 40% 40%)" },  // Vert Menthe Pastel
  { background: "hsl(50 100% 90%)", text: "hsl(50 60% 40%)" },   // Jaune Pâle
  { background: "hsl(260 100% 92%)", text: "hsl(260 50% 45%)" }, // Lavande Claire
  { background: "hsl(30 100% 90%)", text: "hsl(30 60% 40%)" },   // Pêche Pastel
];

const CSV_HEADERS = [
  "NOM", "PRENOM", "DATE", "SEXE", "CLASSE",
  "OPTION1", "OPTION2", "OPTION3", "NIVEAU",
  "NPMA_NOM", "NPMA_PRENOM", "AMA_NOM", "AMA_PRENOM",
  "CODE_VIGILANCE", "PAP", "COMMENTAIRES", "FUTURE_CLASSE"
];

export default function HomePage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCsvData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedLevels, setDetectedLevels] = useState<string[]>([]);
  const [levelStats, setLevelStats] = useState<Record<string, LevelStats>>({});
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const extractLevelsAndStats = (data: ParsedCsvData | null) => {
    if (!data || !data.rows.length) {
      setDetectedLevels([]);
      setLevelStats({});
      return;
    }

    const levelsSet = new Set<string>();
    const newLevelStats: Record<string, LevelStats> = {};

    data.rows.forEach(row => {
      const classeValue = row["CLASSE"];
      if (classeValue) {
        const levelMatch = classeValue.match(/^[a-zA-Z0-9]+/);
        const mainLevel = levelMatch ? levelMatch[0].toUpperCase() : null;
        
        if (mainLevel) {
          levelsSet.add(mainLevel);
          if (!newLevelStats[mainLevel]) {
            newLevelStats[mainLevel] = { total: 0, boys: 0, girls: 0, unspecifiedSex: 0 };
          }
          newLevelStats[mainLevel].total++;
          const sexe = row["SEXE"]?.toUpperCase();
          if (sexe === "MASCULIN") {
            newLevelStats[mainLevel].boys++;
          } else if (sexe === "FEMININ" || sexe === "FÉMININ") {
            newLevelStats[mainLevel].girls++;
          } else {
            newLevelStats[mainLevel].unspecifiedSex++;
          }
        }
      }
    });

    const sortedLevels = Array.from(levelsSet).sort((a, b) => {
        const levelOrder: Record<string, number> = {
            "CM2": 0, "6EME": 1, "5EME": 2, "4EME": 3, "3EME": 4,
            "SECONDE": 5, "PREMIERE": 6, "TERMINALE": 7
        };
        const orderA = levelOrder[a] ?? (parseInt(a.match(/\d+/)?.[0] || '0') + 100);
        const orderB = levelOrder[b] ?? (parseInt(b.match(/\d+/)?.[0] || '0') + 100);

        if (orderA !== orderB) {
            return orderB - orderA; 
        }
        return b.localeCompare(a); 
    });
    setDetectedLevels(sortedLevels);
    setLevelStats(newLevelStats);
  };

  useEffect(() => {
    const storedData = localStorage.getItem('parsedCsvData');
    const storedFileName = localStorage.getItem('csvFileName');
    if (storedData && storedFileName) {
      try {
        const data: ParsedCsvData = JSON.parse(storedData);
        setParsedData(data);
        setFileName(storedFileName);
        extractLevelsAndStats(data); 
      } catch (e) {
        console.error("Erreur lors du chargement des données depuis localStorage", e);
        localStorage.removeItem('parsedCsvData');
        localStorage.removeItem('csvFileName');
        setParsedData(null);
        setFileName(null);
        setDetectedLevels([]);
        setLevelStats({});
      }
    }
  }, []);

  useEffect(() => {
    if (parsedData && fileName) {
      localStorage.setItem('parsedCsvData', JSON.stringify(parsedData));
      localStorage.setItem('csvFileName', fileName);
    } else {
      localStorage.removeItem('parsedCsvData');
      localStorage.removeItem('csvFileName');
    }
  }, [parsedData, fileName]);


  const processFile = (file: File | null) => {
    setFileName(null);
    setParsedData(null);
    setError(null);
    setDetectedLevels([]);
    setLevelStats({});

    if (!file) {
      return;
    }

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("Veuillez sélectionner un fichier CSV valide.");
      setFileName(file.name); 
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        try {
          const lines = text.trim().split(/\r\n|\n|\r/);
          if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === "")) {
            setError("Le fichier CSV est vide ou ne contient que des en-têtes vides.");
            setParsedData(null);
            extractLevelsAndStats(null);
            return;
          }

          const potentialHeaders = lines[0].split(/[,;]/).map(header => header.trim().replace(/^"|"$/g, '').toUpperCase());
          const headers = potentialHeaders.filter(h => h.length > 0);

          if (headers.length === 0) {
            setError("Les en-têtes du fichier CSV sont invalides ou vides.");
            setParsedData(null);
            extractLevelsAndStats(null);
            return;
          }

          const rows: Record<string, string>[] = [];
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim() === "") continue;

            const values: string[] = [];
            let currentVal = '';
            let inQuotes = false;
            for (let char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if ((char === ',' || char === ';') && !inQuotes) {
                    values.push(currentVal.trim().replace(/^"|"$/g, ''));
                    currentVal = '';
                } else {
                    currentVal += char;
                }
            }
            values.push(currentVal.trim().replace(/^"|"$/g, ''));


            if (values.length > 0 && values.some(val => val.length > 0)) {
              const row: Record<string, string> = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || "";
              });
              row["AMA_NOM"] = row["AMA_NOM"] || "";
              row["AMA_PRENOM"] = row["AMA_PRENOM"] || "";
              row["PAP"] = row["PAP"] || "";
              row["COMMENTAIRES"] = row["COMMENTAIRES"] || ""; 
              rows.push(row);
            }
          }
          
          if (rows.length === 0) {
             setError("Aucune ligne de données valide n'a pu être parsée. Vérifiez le format du CSV.");
             setParsedData(null);
             extractLevelsAndStats(null);
          } else {
            rows.forEach(studentRow => {
              if (typeof studentRow["FUTURE_CLASSE"] === 'undefined') {
                studentRow["FUTURE_CLASSE"] = ""; 
              }
              if (typeof studentRow["PAP"] === 'undefined') {
                studentRow["PAP"] = ""; 
              }
              if (typeof studentRow["COMMENTAIRES"] === 'undefined') {
                studentRow["COMMENTAIRES"] = "";
              }
            });
            const data = { headers, rows };
            setParsedData(data);
            extractLevelsAndStats(data);
          }

        } catch (err) {
          setError("Erreur lors du parsing du fichier CSV. Vérifiez le format.");
          setParsedData(null);
          extractLevelsAndStats(null);
          console.error(err);
        }
      }
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier.");
      setParsedData(null);
      extractLevelsAndStats(null);
    };
    reader.readAsText(file, 'UTF-8'); 
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file || null);
    if(event.target) {
      event.target.value = "";
    }
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFile(event.dataTransfer.files[0]);
    }
  };

  const handleDownloadEmptyCsv = () => {
    const csvHeaderString = CSV_HEADERS.map(header => `"${header.replace(/"/g, '""')}"`).join(",") + "\r\n";
    const blob = new Blob([csvHeaderString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "base_vide_eleves.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-background p-8 pt-16">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-center text-5xl font-bold text-primary md:text-6xl">
          ClassExpress
        </h1>
        
        <div className={cn(
            "w-full rounded-lg border-2 border-dashed border-border p-12 text-center transition-colors duration-300",
            isDraggingOver ? "border-primary bg-primary/10" : "hover:border-primary"
          )}>
          <Label 
            htmlFor="file-upload" 
            className="cursor-pointer block"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-2">
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">
                Déposez votre fichier CSV ici ou cliquez pour sélectionner
              </p>
              <p className="text-sm text-muted-foreground">
                (Encodage UTF-8 recommandé pour une compatibilité optimale des caractères accentués)
              </p>
            </div>
          </Label>
          <Input 
            id="file-upload" 
            type="file" 
            className="sr-only" 
            onChange={handleFileChange}
            accept=".csv,text/csv"
          />
        </div>

        <div className="w-full flex justify-center">
            <Button variant="outline" onClick={handleDownloadEmptyCsv}>
              <Download className="mr-2 h-4 w-4" />
              Base Vide (Modèle CSV)
            </Button>
        </div>
        
        {detectedLevels.length > 0 && !error && (
          <Card className="w-full shadow-md">
            <CardHeader>
              <CardTitle>Niveaux de classe à préparer</CardTitle>
              <CardDescription>Sélectionnez un niveau pour commencer le placement des élèves pour l'année suivante.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-row flex-nowrap justify-center gap-3 p-4 overflow-x-auto">
              {detectedLevels.map((level, index) => {
                const colorPair = PASTEL_COLORS[index % PASTEL_COLORS.length];
                return (
                  <Link 
                    href={{
                      pathname: `/placement/${level.toLowerCase().replace(/\s+/g, '-')}`,
                    }} 
                    key={level} 
                    passHref
                  >
                    <Button 
                      className="h-12 px-4 font-semibold"
                      style={{ 
                        backgroundColor: colorPair.background, 
                        color: colorPair.text,
                        border: `1px solid ${colorPair.text}`
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = "0.85"}
                      onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
                    >
                      {level}
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}

        {fileName && (
          <Card className="w-full shadow-md">
            <CardHeader>
              <CardTitle>Informations du fichier</CardTitle>
              <CardDescription>{fileName}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <p className="text-destructive">{error}</p>}
              {parsedData && !error && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Nombre total d'élèves: <span className="font-bold">{parsedData.rows.length}</span>
                  </p>
                  {detectedLevels.length > 0 && Object.keys(levelStats).length > 0 && (
                    <>
                      <p className="text-sm font-medium mt-3">
                        Répartition par niveau:
                      </p>
                      <ul className="list-none space-y-1 text-sm text-muted-foreground">
                        {detectedLevels.map((level) => {
                          const stats = levelStats[level];
                          if (!stats) return null;
                          return (
                            <li key={level} className="pl-2 py-1 border-l-2 border-primary/30">
                              <strong className="text-foreground">{level}:</strong> {stats.total} élève{stats.total > 1 ? 's' : ''}
                              <span className="ml-2 text-xs">
                                (Garçons: {stats.boys}, Filles: {stats.girls}
                                {stats.unspecifiedSex > 0 ? `, Non spécifié: ${stats.unspecifiedSex}` : ''})
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </main>
  );
}
