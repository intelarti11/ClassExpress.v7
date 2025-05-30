
// src/app/placement/[niveau]/page.tsx
"use client";

import React, { useState, useEffect, useMemo, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, User, Users, PlusCircle, GripVertical, Download, Search as SearchIcon, UserPlus, CalendarIcon, Pencil, InfoIcon, AlertTriangle, RotateCcw, Trash2, Settings2, Repeat, X as XIcon, Link2Off, Link2, StickyNote, Wand2, ListRestart, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DayPickerProps } from "react-day-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type UniqueIdentifier,
  MeasuringStrategy,
  rectIntersection,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
  arrayMove as dndArrayMove,
} from '@dnd-kit/sortable';


interface Student {
  NOM: string;
  PRENOM: string;
  DATE: string;
  SEXE: string;
  CLASSE: string;
  OPTION1?: string;
  OPTION2?: string;
  OPTION3?: string;
  NIVEAU?: string;
  NPMA_NOM?: string;
  NPMA_PRENOM?: string;
  FUTURE_CLASSE: string;
  AMA_NOM?: string;
  AMA_PRENOM?: string;
  CODE_VIGILANCE?: string;
  PAP?: string;
  COMMENTAIRES?: string;
  [key: string]: string | undefined;
}

interface ParsedCsvData {
  headers: string[];
  rows: Student[];
}

interface FutureClassShell {
  id: string;
  name: string;
  barrette: number;
}

interface PlacementPageProps {
  params: {
    niveau: string;
  };
}

const UNASSIGNED_CONTAINER_ID = "unassigned-droppable";
const ALL_CLASSES_VALUE = "__ALL_CLASSES__";

const UNSPECIFIED_SELECT_VALUE = "USER_CHOSE_UNSPECIFIED";
const PAP_VALUE_NONE = "__NONE__";

const studentFormSchemaBase = {
  NOM: z.string().min(1, "Le nom est requis.").max(50, "Le nom ne doit pas dépasser 50 caractères."),
  PRENOM: z.string().min(1, "Le prénom est requis.").max(50, "Le prénom ne doit pas dépasser 50 caractères."),
  DATE: z.date().optional(),
  SEXE: z.enum(["MASCULIN", "FÉMININ", UNSPECIFIED_SELECT_VALUE, ""]).optional(),
  NIVEAU: z.enum(["A", "B", "C", "D", UNSPECIFIED_SELECT_VALUE, ""]).optional(),
  NPMA_NOM: z.string().max(50, "Le nom NPMA ne doit pas dépasser 50 caractères.").optional(),
  NPMA_PRENOM: z.string().max(50, "Le prénom NPMA ne doit pas dépasser 50 caractères.").optional(),
  AMA_NOM: z.string().max(50, "Le nom AMA ne doit pas dépasser 50 caractères.").optional(),
  AMA_PRENOM: z.string().max(50, "Le prénom AMA ne doit pas dépasser 50 caractères.").optional(),
  COMMENTAIRES: z.string().optional(),
};

const addStudentFormSchema = z.object({
  ...studentFormSchemaBase,
  OPTION2: z.string().max(50, "L'option ne doit pas dépasser 50 caractères.").optional(),
  OPTION3: z.string().max(50, "L'option ne doit pas dépasser 50 caractères.").optional(),
  PAP: z.string().optional(),
});
type AddStudentFormValues = z.infer<typeof addStudentFormSchema>;

const editStudentFormSchema = z.object({
  ...studentFormSchemaBase,
  CODE_VIGILANCE: z.enum(["ROUGE", "ORANGE", UNSPECIFIED_SELECT_VALUE, ""]).optional(),
  OPTION1: z.string().max(50, "L'option ne doit pas dépasser 50 caractères.").optional(),
  OPTION2: z.string().max(50, "L'option ne doit pas dépasser 50 caractères.").optional(),
  OPTION3: z.string().max(50, "L'option ne doit pas dépasser 50 caractères.").optional(),
  PAP: z.string().optional(),
});
type EditStudentFormValues = z.infer<typeof editStudentFormSchema>;


const dayPickerLabels: DayPickerProps['labels'] = {
  labelMonthDropdown: () => "Mois",
  labelYearDropdown: () => "Année",
};

const KEY_OPTIONS_CONFIG: Array<{keywords: string[], badgeText: string, id: string}> = [
  { keywords: ["latin", "lca latin"], badgeText: "LCA", id: "lca" },
  { keywords: ["grec", "lca grec"], badgeText: "Grec", id: "grec" },
  { keywords: ["section euro", "euro"], badgeText: "Euro", id: "euro" },
  { keywords: ["maths complementaires", "maths comp."], badgeText: "Maths C.", id: "math_comp" },
  { keywords: ["maths expertes", "maths exp."], badgeText: "Maths X.", id: "math_exp" },
  { keywords: ["allemand lv1", "all lv1"], badgeText: "All.LV1", id: "all_lv1" },
  { keywords: ["allemand lv2", "all lv2"], badgeText: "ALL", id: "all_lv2" },
  { keywords: ["ses"], badgeText: "SES", id: "ses" },
  { keywords: ["physique-chimie", "pc"], badgeText: "PC", id: "pc_spc"},
  { keywords: ["svt", "sciences de la vie et de la terre"], badgeText: "SVT", id: "svt_spc"},
  { keywords: ["hlp", "humanités, littérature et philosophie"], badgeText: "HLP", id: "hlp_spc"},
  { keywords: ["hggsp", "histoire-géographie, géopolitique et sciences politiques"], badgeText: "HGGSP", id: "hggsp_spc"},
  { keywords: ["llcer"], badgeText: "LLCER", id: "llcer_spc"},
];

const getOptionBadges = (student: Student): React.ReactNode[] => {
  const badges: React.ReactNode[] = [];
  const studentOptions = [student.OPTION1, student.OPTION2, student.OPTION3]
    .filter(Boolean)
    .map(opt => (opt as string).toLowerCase().trim());

  const displayedBadgeIds = new Set<string>();

  for (const config of KEY_OPTIONS_CONFIG) {
    if (displayedBadgeIds.has(config.id)) continue;

    for (const keyword of config.keywords) {
      if (studentOptions.some(opt => opt.includes(keyword))) {
        badges.push(
          <Badge
            key={`${config.id}-${student.NOM}-${student.PRENOM}`}
            variant="outline"
            className="ml-1 text-xs px-1 py-0 whitespace-nowrap"
          >
            {config.badgeText}
          </Badge>
        );
        displayedBadgeIds.add(config.id);
        break;
      }
    }
  }
  return badges;
};


const getSourceLevel = (targetNiveau: string): string => {
  const upperTargetNiveau = targetNiveau.toUpperCase();
  if (upperTargetNiveau === "SECONDE") return "3EME";
  if (upperTargetNiveau === "PREMIERE") return "SECONDE";
  if (upperTargetNiveau === "TERMINALE") return "PREMIERE";
  if (upperTargetNiveau === "3EME") return "4EME";
  if (upperTargetNiveau === "4EME") return "5EME";
  if (upperTargetNiveau === "5EME") return "6EME";
  if (upperTargetNiveau === "6EME") return "CM2";
  return upperTargetNiveau;
};

const getStudentKey = (student: Student): string => {
  const datePart = student.DATE || "no-date";
  return `${student.NOM}-${student.PRENOM}-${datePart}-${student.CLASSE}`;
};

const normalizeString = (str: string | undefined): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

interface PlacementRule {
  id: string;
  type: 'NO_STUDENT_NAMED_IN_CLASS' | 'AVOID_NPMA_PAIRING' | 'OPTION_BARRETTE_RESTRICTION' | 'ASSIGN_TOGETHER_AMA' | 'OPTION_CLASS_RESTRICTION' | 'BALANCE_LEVEL_IN_CLASS' | 'BALANCE_VIGILANCE_IN_CLASS' | 'BALANCE_PAP_IN_CLASS';
  studentName?: string;
  className?: string;
  message: string;
  optionKeywords?: string[];
  optionDisplayName?: string;
  restrictedToBarrette?: number;
  levelToBalance?: string;
  maxStudentsOfLevel?: number;
  vigilanceToBalance?: string;
  maxStudentsOfVigilance?: number;
  maxStudentsWithPAP?: number;
}

const NPMA_DEFAULT_RULE: PlacementRule = {
  id: 'default-npma-rule',
  type: 'AVOID_NPMA_PAIRING',
  message: "{student1Name} ne doit pas être avec {student2Name} (consigne NPMA)."
};
const AMA_DEFAULT_RULE: PlacementRule = {
  id: 'default-ama-rule',
  type: 'ASSIGN_TOGETHER_AMA',
  message: "{student1Name} ne doit pas être séparé(e) de {student2Name} (consigne AMA)."
};
const LCA_DEFAULT_RULE: PlacementRule = {
  id: 'default-lca-b1-rule',
  type: 'OPTION_BARRETTE_RESTRICTION',
  optionKeywords: ['latin', 'lca latin'],
  optionDisplayName: 'LCA',
  restrictedToBarrette: 1,
  message: "L'option LCA est réservée aux classes de la barrette 1."
};

const CORE_DEFAULT_RULES: PlacementRule[] = [NPMA_DEFAULT_RULE, AMA_DEFAULT_RULE];
const ALL_DEFAULT_RULES: PlacementRule[] = [...CORE_DEFAULT_RULES, LCA_DEFAULT_RULE];


interface ClassViolation {
  hasViolation: boolean;
  messages: string[];
}

const userConfigurableRuleTypesBase: Array<{value: AddRuleFormValues['type'], label: string}> = [
    { value: 'OPTION_BARRETTE_RESTRICTION', label: "Restriction Option/Barrette" },
    { value: 'OPTION_CLASS_RESTRICTION', label: "Restriction Option/Classe" },
    { value: 'NO_STUDENT_NAMED_IN_CLASS', label: "Élève interdit dans classe" },
    { value: 'BALANCE_LEVEL_IN_CLASS', label: "Équilibrage Niveau dans Classe" },
    { value: 'BALANCE_VIGILANCE_IN_CLASS', label: "Équilibrage Code Vigilance" },
    { value: 'BALANCE_PAP_IN_CLASS', label: "Équilibrage PAP" },
];

const addRuleFormSchema = z.object({
  type: z.enum(userConfigurableRuleTypesBase.map(rt => rt.value) as [AddRuleFormValues['type'], ...AddRuleFormValues['type'][]]),
  message: z.string().min(1, "Le message est requis."),
  selectedOptionId: z.string().optional(),
  restrictedToBarrette: z.coerce.number().min(1).max(2).optional(),
  studentName: z.string().optional(),
  className: z.string().optional(),
  levelToBalance: z.enum(["A", "B", "C", "D", UNSPECIFIED_SELECT_VALUE, ""]).optional(),
  maxStudentsOfLevel: z.coerce.number().min(1, "Le nombre maximum d'élèves de ce niveau doit être d'au moins 1.").optional(),
  vigilanceToBalance: z.enum(["ROUGE", "ORANGE", UNSPECIFIED_SELECT_VALUE, ""]).optional(),
  maxStudentsOfVigilance: z.coerce.number().min(1, "Le nombre maximum d'élèves avec ce code vigilance doit être d'au moins 1.").optional(),
  maxStudentsWithPAP: z.coerce.number().min(1, "Le nombre maximum d'élèves avec PAP doit être d'au moins 1.").optional(),
});
type AddRuleFormValues = z.infer<typeof addRuleFormSchema>;

const userConfigurableRuleTypes: Array<{value: AddRuleFormValues['type'], label: string}> = userConfigurableRuleTypesBase;


interface StudentCardDndProps {
  student: Student;
  searchTerm: string;
  isDragging?: boolean;
  isOverlay?: boolean;
  style?: React.CSSProperties;
  onEditStudent: (student: Student) => void;
  onViewDetails: (student: Student) => void;
  showConstraintIcons?: boolean;
  allStudentsForConstraints?: Student[];
  [key: string]: any;
}

interface ConstraintInfo {
  message: string;
}

function StudentCardDnd({
  student,
  searchTerm,
  isDragging,
  isOverlay,
  style: dndStyle,
  onEditStudent,
  onViewDetails,
  showConstraintIcons = false,
  allStudentsForConstraints = [],
  ...props
}: StudentCardDndProps) {
  const studentKey = getStudentKey(student);
  const normalizedSearch = normalizeString(searchTerm.trim());
  const studentNomNormalized = normalizeString(student.NOM);
  const studentPrenomNormalized = normalizeString(student.PRENOM);
  const studentFullName = `${studentNomNormalized} ${studentPrenomNormalized}`;

  const studentNiveauSearchable = student.NIVEAU ? normalizeString(student.NIVEAU) : "";
  const studentOptionsSearchable = [student.OPTION1, student.OPTION2, student.OPTION3]
    .filter(Boolean)
    .map(opt => normalizeString(opt as string));
  const hasMatchingOption = normalizedSearch ? studentOptionsSearchable.some(opt => opt.includes(normalizedSearch)) : false;

  const isMatch = searchTerm.trim().length > 0 && (
      studentFullName.includes(normalizedSearch) ||
      studentNiveauSearchable.includes(normalizedSearch) ||
      hasMatchingOption
    );

  const studentNiveauDisplay = student.NIVEAU?.toUpperCase();

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditStudent(student);
  };

  const handleViewDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(student);
  };

 const { npmaConstraintInfo, amaConstraintInfo } = useMemo(() => {
    let npmaInfo: ConstraintInfo | null = null;
    let amaInfo: ConstraintInfo | null = null;

    if (showConstraintIcons && allStudentsForConstraints && allStudentsForConstraints.length > 0) {
      // NPMA Check
      if (student.NPMA_NOM && student.NPMA_PRENOM) {
        const npmaNomNorm = normalizeString(student.NPMA_NOM);
        const npmaPrenomNorm = normalizeString(student.NPMA_PRENOM);
        const partner = allStudentsForConstraints.find(
          s => normalizeString(s.NOM) === npmaNomNorm && normalizeString(s.PRENOM) === npmaPrenomNorm
        );
        if (partner) { // If NPMA partner exists, we always show the icon and provide info
          const studentInSameClassAsPartner = student.FUTURE_CLASSE && student.FUTURE_CLASSE === partner.FUTURE_CLASSE && student.FUTURE_CLASSE.trim() !== "";
          if (studentInSameClassAsPartner) {
            npmaInfo = {
              message: `NPMA Violation: ${student.PRENOM} ${student.NOM} est avec ${partner.PRENOM} ${partner.NOM} dans la classe ${student.FUTURE_CLASSE}.`,
            };
          } else {
            let partnerStatus = partner.FUTURE_CLASSE ? `est en ${partner.FUTURE_CLASSE}` : `est non positionné(e)`;
            npmaInfo = {
              message: `NPMA Consigne: ${student.PRENOM} ${student.NOM} ne pas mettre avec ${partner.PRENOM} ${partner.NOM}. (Partenaire ${partnerStatus}).`,
            };
          }
        }
      }

      // AMA Check
      if (student.AMA_NOM && student.AMA_PRENOM) {
        const amaNomNorm = normalizeString(student.AMA_NOM);
        const amaPrenomNorm = normalizeString(student.AMA_PRENOM);
        const partner = allStudentsForConstraints.find(
          s => normalizeString(s.NOM) === amaNomNorm && normalizeString(s.PRENOM) === amaPrenomNorm
        );
        if (partner) { // If AMA partner exists, we always show the icon and provide info
          const studentInSameClassAsPartner = student.FUTURE_CLASSE && student.FUTURE_CLASSE === partner.FUTURE_CLASSE && student.FUTURE_CLASSE.trim() !== "";
          if (studentInSameClassAsPartner) {
            amaInfo = {
              message: `AMA Consigne Respectée: ${student.PRENOM} ${student.NOM} est avec ${partner.PRENOM} ${partner.NOM} dans la classe ${student.FUTURE_CLASSE}.`,
            };
          } else {
            let partnerStatus = partner.FUTURE_CLASSE ? `est en ${partner.FUTURE_CLASSE}` : `est non positionné(e)`;
            let studentStatus = student.FUTURE_CLASSE ? `est en ${student.FUTURE_CLASSE}`: `est non positionné(e)`;

            // If both are unassigned, they are technically not in the same *specific* future class yet.
            if (!student.FUTURE_CLASSE && !partner.FUTURE_CLASSE) {
               amaInfo = {
                  message: `AMA Consigne: ${student.PRENOM} ${student.NOM} à mettre avec ${partner.PRENOM} ${partner.NOM}. (Les deux sont non positionnés).`
               };
            } else {
              amaInfo = {
                message: `AMA Violation: ${student.PRENOM} ${student.NOM} (${studentStatus}) doit être avec ${partner.PRENOM} ${partner.NOM}. (Partenaire ${partnerStatus}).`,
              };
            }
          }
        }
      }
    }
    return { npmaConstraintInfo: npmaInfo, amaConstraintInfo: amaInfo };
  }, [student, allStudentsForConstraints, showConstraintIcons]);


  return (
      <Card
        {...props}
        style={dndStyle}
        data-student-key={studentKey}
        className={cn(
          "p-px shadow hover:shadow-lg transition-shadow cursor-grab active:cursor-grabbing select-none",
          "flex items-center space-x-1 pl-2",
          isDragging && !isOverlay ? "opacity-30" : "",
          isOverlay ? "opacity-75 ring-2 ring-primary z-50 shadow-2xl transform rotate-2" : "",
          isMatch && !isOverlay ? "ring-2 ring-yellow-400 border-yellow-400 bg-yellow-50" : "",
        )}
      >
        <span
          className={cn(
            "w-3 h-3 rounded-full flex-shrink-0 cursor-pointer hover:opacity-75 border",
            {
              "bg-green-700 border-green-700": studentNiveauDisplay === "A",
              "bg-green-500 border-green-500": studentNiveauDisplay === "B",
              "bg-yellow-400 border-yellow-400": studentNiveauDisplay === "C",
              "bg-red-500 border-red-500": studentNiveauDisplay === "D",
              "bg-card border-border": !studentNiveauDisplay || !["A", "B", "C", "D"].includes(studentNiveauDisplay),
            }
          )}
          title={studentNiveauDisplay ? `Niveau ${studentNiveauDisplay} - Voir détails` : "Niveau non spécifié - Voir détails"}
          onClick={handleViewDetailsClick}
        ></span>
        <div className="flex-grow flex items-baseline space-x-1 overflow-hidden">
          <div className="flex items-baseline min-w-0">
            <span className={cn(
                "font-semibold text-sm truncate",
                {
                  "text-red-600": student.CODE_VIGILANCE?.toUpperCase() === "ROUGE",
                  "text-orange-500": student.CODE_VIGILANCE?.toUpperCase() === "ORANGE",
                }
            )}>
                {student.NOM}
            </span>
            <span className={cn(
                "font-normal text-sm truncate ml-1",
                 student.PAP && student.PAP.trim() !== "" && "text-yellow-600"
            )}>
                {student.PRENOM}
            </span>
            <div className="flex flex-shrink-0 items-baseline">
              {getOptionBadges(student)}
            </div>
          </div>
        </div>

        {showConstraintIcons && npmaConstraintInfo && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 flex-shrink-0 text-destructive hover:bg-destructive/10 cursor-default" tabIndex={-1}>
                  <Link2Off size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                 <p>{npmaConstraintInfo.message}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {showConstraintIcons && amaConstraintInfo && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-6 w-6 p-0 flex-shrink-0 text-blue-600 hover:bg-blue-600/10 cursor-default" tabIndex={-1}>
                    <Link2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{amaConstraintInfo.message}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {!(isDragging || isOverlay) && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 p-0 flex-shrink-0 hover:bg-accent/50",
                 student.COMMENTAIRES && student.COMMENTAIRES.trim() !== "" && "text-sky-600 hover:text-sky-700"
                )}
              onClick={handleEditClick}
              aria-label="Modifier l'élève"
            >
              <Pencil size={12} />
            </Button>
          </>
        )}
      </Card>
  );
}

function SortableStudentCard({ student, searchTerm, onEditStudent, onViewDetails, showConstraintIcons, allStudentsForConstraints }: { student: Student, searchTerm: string, onEditStudent: (student: Student) => void, onViewDetails: (student: Student) => void, showConstraintIcons?: boolean, allStudentsForConstraints?: Student[] }) {
  const studentKey = getStudentKey(student);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: studentKey});

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <StudentCardDnd
      ref={setNodeRef}
      style={style}
      student={student}
      searchTerm={searchTerm}
      isDragging={isDragging}
      onEditStudent={onEditStudent}
      onViewDetails={onViewDetails}
      showConstraintIcons={showConstraintIcons}
      allStudentsForConstraints={allStudentsForConstraints}
      {...attributes}
      {...listeners}
    />
  );
}

interface ClassDetailedStats {
  niveaux: { A: number; B: number; C: number; D: number; unspecified: number };
  vigilance: { ROUGE: number; ORANGE: number };
  papCount: number;
}

interface FutureClassCardProps {
  classShell: FutureClassShell;
  allStudents: Student[];
  activeId: UniqueIdentifier | null;
  currentOverDroppableId: UniqueIdentifier | null;
  searchTerm: string;
  classViolations: Record<string, ClassViolation>;
  detailedStats: ClassDetailedStats | undefined;
  onEditStudent: (student: Student) => void;
  onViewDetails: (student: Student) => void;
  onReorderStudents: (className: string) => void;
}

function FutureClassCard({
  classShell,
  allStudents,
  activeId,
  currentOverDroppableId,
  searchTerm,
  classViolations,
  detailedStats,
  onEditStudent,
  onViewDetails,
  onReorderStudents,
}: FutureClassCardProps) {
  const { setNodeRef: setClassDroppableRef } = useDroppable({ id: classShell.id });
  const studentsInThisClass = allStudents.filter(s => s.FUTURE_CLASSE === classShell.name);
  const studentKeysInThisClass = studentsInThisClass.map(s => getStudentKey(s));
  const boysCount = studentsInThisClass.filter(s => s.SEXE?.toUpperCase() === "MASCULIN").length;
  const girlsCount = studentsInThisClass.filter(s => s.SEXE?.toUpperCase() === "FÉMININ" || s.SEXE?.toUpperCase() === "FEMININ").length;
  const studentCount = studentsInThisClass.length;
  const studentLabel = studentCount <= 1 ? "élève" : "élèves";
  const violation = classViolations[classShell.id] || { hasViolation: false, messages: [] };

  const cardStyleProps: React.CSSProperties = {};
  const headerStyleProps: React.CSSProperties = {};
  let cardClasses = "flex flex-col shadow-md";
  let headerClasses = "pb-3";

  if (violation.hasViolation) {
    cardClasses = cn(cardClasses, "bg-red-100 border-red-500");
    headerClasses = cn(headerClasses, "bg-red-200/50");
  } else if (activeId && currentOverDroppableId === classShell.id) {
    if (classShell.barrette === 1) {
      headerStyleProps.backgroundColor = 'hsl(30, 100%, 88%)';
      cardStyleProps.backgroundColor = 'hsl(30, 100%, 94%)';
      cardClasses = cn(cardClasses, "ring-2 ring-offset-1 ring-orange-400");
    } else if (classShell.barrette === 2) {
      headerStyleProps.backgroundColor = 'hsl(260, 70%, 88%)';
      cardStyleProps.backgroundColor = 'hsl(260, 70%, 94%)';
      cardClasses = cn(cardClasses, "ring-2 ring-offset-1 ring-purple-400");
    } else {
      headerClasses = cn(headerClasses, "bg-muted/50");
    }
  } else {
    if (classShell.barrette === 1) {
      cardStyleProps.backgroundColor = 'hsl(30, 100%, 96%)';
      headerStyleProps.backgroundColor = 'hsl(30, 100%, 92%)';
    } else if (classShell.barrette === 2) {
      cardStyleProps.backgroundColor = 'hsl(260, 70%, 96%)';
      headerStyleProps.backgroundColor = 'hsl(260, 70%, 92%)';
    } else {
      headerClasses = cn(headerClasses, "bg-muted/50");
    }
  }


  return (
    <Dialog>
      <Card
        ref={setClassDroppableRef}
        className={cn(cardClasses)}
        style={cardStyleProps}
      >
        <CardHeader
          className={cn(headerClasses)}
          style={headerStyleProps}
        >
          <CardTitle className="flex flex-col text-lg">
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => onReorderStudents(classShell.name)}
                className="truncate pr-2 text-left hover:text-primary hover:underline focus:outline-none focus:text-primary focus:underline font-semibold flex items-center group"
                title={`Réorganiser ${classShell.name} par niveau (A-D)`}
              >
                {classShell.name}
                <ListRestart size={14} className="ml-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
               <div className="flex items-center gap-1">
                {violation.hasViolation && violation.messages.length > 0 && (
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10">
                        <AlertTriangle size={16} />
                    </Button>
                  </DialogTrigger>
                )}
                <Badge variant={violation.hasViolation ? "destructive" : "secondary"} className="text-sm whitespace-nowrap">
                    {studentCount} {studentLabel}
                </Badge>
              </div>
            </div>
            <div className="flex items-center text-xs mt-1.5 self-end">
              <span className={cn("px-2.5 py-1 rounded-l-full font-medium", violation.hasViolation ? "bg-red-200 text-red-800" : "bg-sky-100 text-sky-700")}>
                G: {boysCount}
              </span>
              <span className={cn("px-2.5 py-1 rounded-r-full font-medium", violation.hasViolation ? "bg-red-200 text-red-800" : "bg-pink-100 text-pink-700")}>
                F: {girlsCount}
              </span>
            </div>
            {detailedStats && (
              <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                {(detailedStats.niveaux.A > 0 || detailedStats.niveaux.B > 0 || detailedStats.niveaux.C > 0 || detailedStats.niveaux.D > 0 || detailedStats.niveaux.unspecified > 0) && (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>Niv:</span>
                    {detailedStats.niveaux.A > 0 && <span className={cn("font-medium", "text-green-700")}>A:{detailedStats.niveaux.A}</span>}
                    {detailedStats.niveaux.B > 0 && <span className={cn("font-medium", "text-green-500")}>B:{detailedStats.niveaux.B}</span>}
                    {detailedStats.niveaux.C > 0 && <span className={cn("font-medium", "text-yellow-500")}>C:{detailedStats.niveaux.C}</span>}
                    {detailedStats.niveaux.D > 0 && <span className={cn("font-medium", "text-red-500")}>D:{detailedStats.niveaux.D}</span>}
                    {detailedStats.niveaux.unspecified > 0 && <span className="font-medium text-foreground">N/S:{detailedStats.niveaux.unspecified}</span>}
                    </div>
                )}
                {(detailedStats.vigilance.ROUGE > 0 || detailedStats.vigilance.ORANGE > 0 || detailedStats.papCount > 0) && (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                    {(detailedStats.vigilance.ROUGE > 0 || detailedStats.vigilance.ORANGE > 0) && <span className="mr-0.5">Vig:</span>}
                    {detailedStats.vigilance.ROUGE > 0 && <span className="font-medium text-red-600">R:{detailedStats.vigilance.ROUGE}</span>}
                    {detailedStats.vigilance.ORANGE > 0 && <span className="font-medium text-orange-500">O:{detailedStats.vigilance.ORANGE}</span>}
                    {detailedStats.papCount > 0 && (
                        <>
                        {(detailedStats.vigilance.ROUGE > 0 || detailedStats.vigilance.ORANGE > 0) && <span className="mx-0.5">|</span>}
                        <span className="font-medium text-yellow-600">PAP:{detailedStats.papCount}</span>
                        </>
                    )}
                    </div>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow min-h-[150px] p-0 flex flex-col">
          <SortableContext items={studentKeysInThisClass} strategy={verticalListSortingStrategy} id={classShell.id}>
            <div className="flex-grow p-4 space-y-1">
              {studentsInThisClass.map(student => (
                <SortableStudentCard
                    student={student}
                    key={getStudentKey(student)}
                    searchTerm={searchTerm}
                    onEditStudent={onEditStudent}
                    onViewDetails={onViewDetails}
                    showConstraintIcons={true}
                    allStudentsForConstraints={allStudents}
                />
              ))}
              {studentsInThisClass.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">Déposez des élèves ici</p>
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>

      {violation.hasViolation && violation.messages.length > 0 && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
              <DialogTitle>Violation(s) de Règle</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
            {violation.messages.map((msg, index) => (
              <p key={index} className="text-sm">{msg}</p>
            ))}
          </div>
          <DialogFooter className="pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Fermer</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

type FilterState = {
  niveau: string | null;
  pap: 'avec' | 'sans' | null;
  options: string[];
  vigilance: 'ROUGE' | 'ORANGE' | null;
};

interface ClassReportInfo {
  className: string;
  classId: string;
  score: number;
  studentCount: number;
  boysCount: number;
  girlsCount: number;
  unspecifiedSexCount: number;
  niveaux: { A: number; B: number; C: number; D: number; unspecified: number };
  vigilance: { ROUGE: number; ORANGE: number; unspecified: number };
  papCount: number;
  violatedRuleMessages: string[];
}

function calculateClassScoreAndDetails(
  classShell: FutureClassShell,
  studentsInClass: Student[],
  allStudentsInContext: Student[], // All students in the current level (source for global ratios)
  allRules: PlacementRule[],
  globalBoyRatio: number,
  globalGirlRatio: number,
  classViolationsForThisClass: ClassViolation // Pass pre-calculated violations
): ClassReportInfo {
  let score = 0;

  const reportDetails: Omit<ClassReportInfo, 'className' | 'classId' | 'score'> = {
    studentCount: studentsInClass.length,
    boysCount: studentsInClass.filter(s => s.SEXE === "MASCULIN").length,
    girlsCount: studentsInClass.filter(s => s.SEXE === "FÉMININ" || s.SEXE === "FEMININ").length,
    unspecifiedSexCount: 0, // Will be calculated
    niveaux: { A: 0, B: 0, C: 0, D: 0, unspecified: 0 },
    vigilance: { ROUGE: 0, ORANGE: 0, unspecified: 0 },
    papCount: studentsInClass.filter(s => s.PAP && s.PAP.trim() !== "").length,
    violatedRuleMessages: classViolationsForThisClass?.messages || [],
  };
  reportDetails.unspecifiedSexCount = reportDetails.studentCount - reportDetails.boysCount - reportDetails.girlsCount;

  studentsInClass.forEach(s => {
    const niv = s.NIVEAU?.toUpperCase();
    if (niv === 'A') reportDetails.niveaux.A++;
    else if (niv === 'B') reportDetails.niveaux.B++;
    else if (niv === 'C') reportDetails.niveaux.C++;
    else if (niv === 'D') reportDetails.niveaux.D++;
    else reportDetails.niveaux.unspecified++;

    const vig = s.CODE_VIGILANCE?.toUpperCase();
    if (vig === 'ROUGE') reportDetails.vigilance.ROUGE++;
    else if (vig === 'ORANGE') reportDetails.vigilance.ORANGE++;
    else if (!vig || vig.trim() === "") reportDetails.vigilance.unspecified++;
  });

  // Scoring Logic
  studentsInClass.forEach(student => {
    if (student.AMA_NOM && student.AMA_PRENOM) {
      const amaNomNorm = normalizeString(student.AMA_NOM);
      const amaPrenomNorm = normalizeString(student.AMA_PRENOM);
      const amaPartner = allStudentsInContext.find(s =>
        normalizeString(s.NOM) === amaNomNorm &&
        normalizeString(s.PRENOM) === amaPrenomNorm
      );
      if (amaPartner && studentsInClass.some(sInClass => getStudentKey(sInClass) === getStudentKey(amaPartner))) {
        score += 50; // Positive score for AMA pair in the same class
      }
    }
  });

  score -= reportDetails.studentCount * 2; // Penalty for larger classes (helps balance size)

  if (reportDetails.studentCount > 0 && (reportDetails.boysCount + reportDetails.girlsCount > 0) && (globalBoyRatio > 0 || globalGirlRatio > 0)) {
    const currentClassTotalWithGender = reportDetails.boysCount + reportDetails.girlsCount;
    const currentClassBoyRatio = currentClassTotalWithGender > 0 ? reportDetails.boysCount / currentClassTotalWithGender : 0.5; // Avoid division by zero
    const currentClassGirlRatio = currentClassTotalWithGender > 0 ? reportDetails.girlsCount / currentClassTotalWithGender : 0.5; // Avoid division by zero


    const boyDeviation = Math.abs(currentClassBoyRatio - globalBoyRatio);
    const girlDeviation = Math.abs(currentClassGirlRatio - globalGirlRatio);

    const genderFactor = currentClassTotalWithGender / reportDetails.studentCount; // Weight by proportion of students with specified gender
    score -= (boyDeviation + girlDeviation) * 8.0 * genderFactor * reportDetails.studentCount;
  }


  Object.values(reportDetails.niveaux).forEach(count => {
    if (count > 1) score -= (count - 1) * 3; // Penalize concentration of same level
  });

  score -= reportDetails.vigilance.ROUGE * 10;
  score -= reportDetails.vigilance.ORANGE * 5;
  score -= reportDetails.papCount * 4;
  score -= (reportDetails.violatedRuleMessages.length * 100); // Heavy penalty for each rule violation

  return {
    className: classShell.name,
    classId: classShell.id,
    score: Math.round(score),
    ...reportDetails
  };
}


export default function PlacementPage({ params: paramsProp }: PlacementPageProps) {
  const { toast } = useToast();
  const { niveau } = React.use(paramsProp); // Corrected: Use React.use() for params
  const targetLevelDisplay = useMemo(() => niveau.toUpperCase().replace(/-/g, ' '), [niveau]);

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [sourceLevel, setSourceLevel] = useState<string>("");

  const [numberOfClassesBarrette1, setNumberOfClassesBarrette1] = useState<number>(3);
  const [numberOfClassesBarrette2, setNumberOfClassesBarrette2] = useState<number>(4);
  const [futureClasses, setFutureClasses] = useState<FutureClassShell[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeFilters, setActiveFilters] = useState<FilterState>({ niveau: null, pap: null, options: [], vigilance: null });

  const [isAutoPlacing, setIsAutoPlacing] = useState(false);

  const [isAddStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [isAddRepeaterDialogOpen, setAddRepeaterDialogOpen] = useState(false);
  const [repeaterSearchTerm, setRepeaterSearchTerm] = useState<string>("");
  const [selectedRepeaterKey, setSelectedRepeaterKey] = useState<string | null>(null);

  const [isEditStudentDialogOpen, setEditStudentDialogOpen] = useState(false);
  const [editingStudentKey, setEditingStudentKey] = useState<string | null>(null);
  const [isStudentDetailsDialogOpen, setStudentDetailsDialogOpen] = useState(false);
  const [viewingStudentDetailsKey, setViewingStudentDetailsKey] = useState<string | null>(null);
  const [isResetConfirmationDialogOpen, setResetConfirmationDialogOpen] = useState(false);

  const [placementRules, setPlacementRules] = useState<PlacementRule[]>([]);
  const [isAddRuleDialogOpen, setAddRuleDialogOpen] = useState(false);
  const [isManageRulesDialogOpen, setManageRulesDialogOpen] = useState(false);
  const [ruleToDeleteId, setRuleToDeleteId] = useState<string | null>(null);

  const [classViolations, setClassViolations] = useState<Record<string, ClassViolation>>({});

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [currentOverDroppableId, setCurrentOverDroppableId] = useState<UniqueIdentifier | null>(null);

  const { setNodeRef: setUnassignedDroppableRef } = useDroppable({ id: UNASSIGNED_CONTAINER_ID });

  const [reportData, setReportData] = useState<ClassReportInfo[]>([]);
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addStudentForm = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentFormSchema),
    defaultValues: { NOM: "", PRENOM: "", SEXE: UNSPECIFIED_SELECT_VALUE, NIVEAU: UNSPECIFIED_SELECT_VALUE, NPMA_NOM: "", NPMA_PRENOM: "", AMA_NOM: "", AMA_PRENOM: "", OPTION2: "", OPTION3: "", PAP: PAP_VALUE_NONE, COMMENTAIRES: "" },
  });

  const editStudentForm = useForm<EditStudentFormValues>({
    resolver: zodResolver(editStudentFormSchema),
    defaultValues: { NOM: "", PRENOM: "", SEXE: UNSPECIFIED_SELECT_VALUE, NIVEAU: UNSPECIFIED_SELECT_VALUE, CODE_VIGILANCE: UNSPECIFIED_SELECT_VALUE, OPTION1: "", OPTION2: "", OPTION3: "", NPMA_NOM: "", NPMA_PRENOM: "", AMA_NOM: "", AMA_PRENOM: "", PAP: PAP_VALUE_NONE, COMMENTAIRES: "" },
  });

  const addRuleForm = useForm<AddRuleFormValues>({
    resolver: zodResolver(addRuleFormSchema),
    defaultValues: {
      type: 'OPTION_BARRETTE_RESTRICTION',
      message: "L'option {optionDisplayName} est réservée aux classes de la barrette {restrictedToBarrette}.",
      selectedOptionId: "",
      restrictedToBarrette: 1,
      studentName: "",
      className: ALL_CLASSES_VALUE,
      levelToBalance: UNSPECIFIED_SELECT_VALUE,
      maxStudentsOfLevel: 1,
      vigilanceToBalance: UNSPECIFIED_SELECT_VALUE,
      maxStudentsOfVigilance: 1,
      maxStudentsWithPAP: 1,
    },
  });
  const watchedRuleType = addRuleForm.watch("type");
  const watchedRuleStudentName = addRuleForm.watch("studentName");
  const watchedRuleClassName = addRuleForm.watch("className");
  const watchedSelectedOptionId = addRuleForm.watch("selectedOptionId");
  const watchedLevelToBalance = addRuleForm.watch("levelToBalance");
  const watchedMaxStudentsOfLevel = addRuleForm.watch("maxStudentsOfLevel");
  const watchedVigilanceToBalance = addRuleForm.watch("vigilanceToBalance");
  const watchedMaxStudentsOfVigilance = addRuleForm.watch("maxStudentsOfVigilance");
  const watchedMaxStudentsWithPAP = addRuleForm.watch("maxStudentsWithPAP");
  const watchedRestrictedToBarrette = addRuleForm.watch("restrictedToBarrette");


  const activeStudent = useMemo(() => {
    if (!activeId) return null;
    return allStudents.find(s => getStudentKey(s) === activeId);
  }, [activeId, allStudents]);

  const studentBeingViewed = useMemo(() => {
    if (!viewingStudentDetailsKey) return null;
    return allStudents.find(s => getStudentKey(s) === viewingStudentDetailsKey);
  }, [viewingStudentDetailsKey, allStudents]);

  const relevantOptionsForFilters = useMemo(() => {
    if (!allStudents.length) return [];
    const presentOptionIds = new Set<string>();
    // Consider ALL students for determining relevant filter options, not just unassigned
    allStudents.forEach(student => {
      const studentOptionsRaw = [student.OPTION1, student.OPTION2, student.OPTION3]
        .filter(Boolean)
        .map(opt => (opt as string).toLowerCase().trim());

      KEY_OPTIONS_CONFIG.forEach(configOption => {
        if (presentOptionIds.has(configOption.id)) return;
        for (const keyword of configOption.keywords) {
          if (studentOptionsRaw.some(rawOpt => rawOpt.includes(keyword))) {
            presentOptionIds.add(configOption.id);
            break;
          }
        }
      });
    });
    return KEY_OPTIONS_CONFIG.filter(configOption => presentOptionIds.has(configOption.id));
  }, [allStudents]);


  const studentsToPlace = useMemo(() => {
    if (!sourceLevel || allStudents.length === 0) return [];
    let filteredStudents = allStudents.filter(
      (student) =>
        student.CLASSE.toUpperCase().startsWith(sourceLevel) &&
        (!student.FUTURE_CLASSE || student.FUTURE_CLASSE.trim() === "")
    );

    // Apply quick filters
    if (activeFilters.niveau) {
      if (activeFilters.niveau === "N/S") {
        filteredStudents = filteredStudents.filter(s => !s.NIVEAU || s.NIVEAU.trim() === "");
      } else {
        filteredStudents = filteredStudents.filter(s => s.NIVEAU?.toUpperCase() === activeFilters.niveau);
      }
    }
    if (activeFilters.pap) {
      if (activeFilters.pap === 'avec') {
        filteredStudents = filteredStudents.filter(s => s.PAP && s.PAP.trim() !== "");
      } else if (activeFilters.pap === 'sans') {
        filteredStudents = filteredStudents.filter(s => !s.PAP || s.PAP.trim() === "");
      }
    }
    if (activeFilters.options.length > 0) {
      filteredStudents = filteredStudents.filter(student => {
        const studentOptionsRaw = [student.OPTION1, student.OPTION2, student.OPTION3]
          .filter(Boolean)
          .map(opt => (opt as string).toLowerCase().trim());

        return activeFilters.options.some(activeOptionId => {
          const configOption = KEY_OPTIONS_CONFIG.find(co => co.id === activeOptionId);
          if (!configOption) return false;
          return configOption.keywords.some(keyword =>
            studentOptionsRaw.some(rawOpt => rawOpt.includes(keyword))
          );
        });
      });
    }
    if (activeFilters.vigilance) {
        filteredStudents = filteredStudents.filter(s => s.CODE_VIGILANCE?.toUpperCase() === activeFilters.vigilance);
    }


    // Apply text search
    const normalizedSearch = normalizeString(searchTerm.trim());
    if (normalizedSearch) {
      filteredStudents = filteredStudents.filter(student => {
        const studentFullName = normalizeString(`${student.NOM} ${student.PRENOM}`);
        const studentNiveauSearchable = student.NIVEAU ? normalizeString(student.NIVEAU) : "";
        const studentOptionsSearchable = [student.OPTION1, student.OPTION2, student.OPTION3]
            .filter(Boolean)
            .map(opt => normalizeString(opt as string));
        const hasMatchingOption = studentOptionsSearchable.some(opt => opt.includes(normalizedSearch));

        return studentFullName.includes(normalizedSearch) ||
               studentNiveauSearchable.includes(normalizedSearch) ||
               hasMatchingOption;
      });
    }

    return filteredStudents.sort((a, b) => {
      const niveauOrder: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };
      const aNiveau = a.NIVEAU?.toUpperCase() || "";
      const bNiveau = b.NIVEAU?.toUpperCase() || "";
      const aOrder = niveauOrder[aNiveau] || 5;
      const bOrder = niveauOrder[bNiveau] || 5;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return normalizeString(a.NOM).localeCompare(normalizeString(b.NOM));
    });

  }, [allStudents, sourceLevel, searchTerm, activeFilters]);

  const unassignedStudentKeys = useMemo(() => studentsToPlace.map(s => getStudentKey(s)), [studentsToPlace]);


  const studentsAlreadyInPlacementPool = useMemo(() =>
      new Set(studentsToPlace.map(getStudentKey)),
      [studentsToPlace]
  );

  const filteredPotentialRepeaters = useMemo(() => {
    let candidates = allStudents.filter(s => !studentsAlreadyInPlacementPool.has(getStudentKey(s)));

    if (!repeaterSearchTerm.trim()) {
      return candidates.sort((a,b) => `${a.NOM} ${a.PRENOM}`.localeCompare(`${b.NOM} ${b.PRENOM}`));
    }
    const normalizedSearch = normalizeString(repeaterSearchTerm);
    return candidates.filter(student =>
      normalizeString(`${student.NOM} ${student.PRENOM}`).includes(normalizedSearch) ||
      normalizeString(student.CLASSE).includes(normalizedSearch)
    ).sort((a,b) => `${a.NOM} ${a.PRENOM}`.localeCompare(`${b.NOM} ${b.PRENOM}`));
  }, [repeaterSearchTerm, allStudents, studentsAlreadyInPlacementPool]);

  const relevantOptionsForRules = useMemo(() => {
    if (!allStudents.length) return [];

    const presentOptionIds = new Set<string>();
    allStudents.forEach(student => {
      const studentOptionsRaw = [student.OPTION1, student.OPTION2, student.OPTION3]
        .filter(Boolean)
        .map(opt => (opt as string).toLowerCase().trim());

      KEY_OPTIONS_CONFIG.forEach(configOption => {
        if (presentOptionIds.has(configOption.id)) return;

        for (const keyword of configOption.keywords) {
          if (studentOptionsRaw.some(rawOpt => rawOpt.includes(keyword))) {
            presentOptionIds.add(configOption.id);
            break;
          }
        }
      });
    });

    return KEY_OPTIONS_CONFIG.filter(configOption => presentOptionIds.has(configOption.id));
  }, [allStudents]);

  const classDetailedStats = useMemo(() => {
    const stats: Record<string, ClassDetailedStats> = {};
    if (!allStudents || allStudents.length === 0 || !futureClasses || futureClasses.length === 0) {
      return stats;
    }

    futureClasses.forEach(fc => {
      const studentsInClass = allStudents.filter(s => s.FUTURE_CLASSE === fc.name);
      const currentClassStats: ClassDetailedStats = {
        niveaux: { A: 0, B: 0, C: 0, D: 0, unspecified: 0 },
        vigilance: { ROUGE: 0, ORANGE: 0 },
        papCount: 0,
      };

      studentsInClass.forEach(student => {
        const niveau = student.NIVEAU?.toUpperCase();
        if (niveau === 'A') currentClassStats.niveaux.A++;
        else if (niveau === 'B') currentClassStats.niveaux.B++;
        else if (niveau === 'C') currentClassStats.niveaux.C++;
        else if (niveau === 'D') currentClassStats.niveaux.D++;
        else currentClassStats.niveaux.unspecified++;

        const vigilanceCode = student.CODE_VIGILANCE?.toUpperCase();
        if (vigilanceCode === 'ROUGE') currentClassStats.vigilance.ROUGE++;
        else if (vigilanceCode === 'ORANGE') currentClassStats.vigilance.ORANGE++;

        if (student.PAP && student.PAP.trim() !== "") {
          currentClassStats.papCount++;
        }
      });
      stats[fc.id] = currentClassStats;
    });
    return stats;
  }, [allStudents, futureClasses]);


  useEffect(() => {
    try {
      const storedData = localStorage.getItem('parsedCsvData');
      if (storedData) {
        const data: ParsedCsvData = JSON.parse(storedData);
        setAllStudents(data.rows);
        setCsvHeaders(data.headers);

        const storedFutureClasses = localStorage.getItem(`futureClasses_${targetLevelDisplay}`);
        if (storedFutureClasses) {
            const parsedFutureClassShells: FutureClassShell[] = JSON.parse(storedFutureClasses);
            setFutureClasses(parsedFutureClassShells.map(fc => ({id: fc.id, name: fc.name, barrette: fc.barrette || 1})));
        }

        const storedRules = localStorage.getItem(`placementRules_${targetLevelDisplay}`);
        if (storedRules) {
            let loadedRules = JSON.parse(storedRules) as PlacementRule[];
            // Ensure core default rules (NPMA, AMA) are present
            CORE_DEFAULT_RULES.forEach(coreRule => {
                if (!loadedRules.find(r => r.id === coreRule.id)) {
                    loadedRules.push(coreRule); // Add if missing
                }
            });
            setPlacementRules(loadedRules);
        } else {
            setPlacementRules(ALL_DEFAULT_RULES); // Load all defaults if no specific rules stored
        }

      } else {
        setError("Aucune donnée d'élève trouvée. Veuillez charger un fichier CSV sur la page d'accueil.");
      }
    } catch (e) {
      console.error("Erreur lors du chargement des données depuis localStorage", e);
      setError("Erreur lors du chargement des données des élèves ou des règles.");
    } finally {
      setIsLoading(false);
    }
  }, [targetLevelDisplay]);

  useEffect(() => {
    setSourceLevel(getSourceLevel(targetLevelDisplay));
  }, [targetLevelDisplay]);

  useEffect(() => {
    if (!isLoading && csvHeaders.length > 0 && allStudents.length > 0) {
      const dataToStore = { headers: csvHeaders, rows: allStudents };
      localStorage.setItem('parsedCsvData', JSON.stringify(dataToStore));
    }
  }, [allStudents, csvHeaders, isLoading]);

  useEffect(() => {
    if (futureClasses.length > 0) {
        localStorage.setItem(`futureClasses_${targetLevelDisplay}`, JSON.stringify(futureClasses));
    } else if (!isLoading && !error) {
        localStorage.removeItem(`futureClasses_${targetLevelDisplay}`);
    }
  }, [futureClasses, targetLevelDisplay, isLoading, error]);

  useEffect(() => {
    if (!isLoading && !error) {
        localStorage.setItem(`placementRules_${targetLevelDisplay}`, JSON.stringify(placementRules));
    }
  }, [placementRules, targetLevelDisplay, isLoading, error]);

  useEffect(() => {
    if (editingStudentKey && isEditStudentDialogOpen) {
      const studentToEdit = allStudents.find(s => getStudentKey(s) === editingStudentKey);
      if (studentToEdit) {
        let birthDate: Date | undefined = undefined;
        if (studentToEdit.DATE) {
          try {
            let parsedDate = parse(studentToEdit.DATE, "dd/MM/yy", new Date());
            if (isNaN(parsedDate.getTime())) {
                parsedDate = parse(studentToEdit.DATE, "dd/MM/yyyy", new Date());
            }
            if (!isNaN(parsedDate.getTime())) {
               birthDate = parsedDate;
            }
          } catch(e) { console.error("Error parsing date for edit form:", e); }
        }

        let sexeValue = UNSPECIFIED_SELECT_VALUE;
        if (studentToEdit.SEXE) {
            const upperSexe = studentToEdit.SEXE.toUpperCase();
            if (upperSexe === "MASCULIN" || upperSexe === "FÉMININ") {
                sexeValue = upperSexe;
            }
        }

        editStudentForm.reset({
          NOM: studentToEdit.NOM,
          PRENOM: studentToEdit.PRENOM,
          DATE: birthDate,
          SEXE: sexeValue,
          NIVEAU: studentToEdit.NIVEAU?.toUpperCase() || UNSPECIFIED_SELECT_VALUE,
          CODE_VIGILANCE: studentToEdit.CODE_VIGILANCE?.toUpperCase() || UNSPECIFIED_SELECT_VALUE,
          OPTION1: studentToEdit.OPTION1 || "",
          OPTION2: studentToEdit.OPTION2 || "",
          OPTION3: studentToEdit.OPTION3 || "",
          NPMA_NOM: studentToEdit.NPMA_NOM || "",
          NPMA_PRENOM: studentToEdit.NPMA_PRENOM || "",
          AMA_NOM: studentToEdit.AMA_NOM || "",
          AMA_PRENOM: studentToEdit.AMA_PRENOM || "",
          PAP: (studentToEdit.PAP && studentToEdit.PAP.trim() !== "") ? "PAP" : PAP_VALUE_NONE,
          COMMENTAIRES: studentToEdit.COMMENTAIRES || "",
        });
      }
    }
  }, [editingStudentKey, isEditStudentDialogOpen, allStudents, editStudentForm]);

 useEffect(() => {
    let newMessage = "";
    const currentMessage = addRuleForm.getValues("message");
    const studentNameValue = watchedRuleStudentName || "{studentName}";
    let classNameValue = watchedRuleClassName;

    const selectedOptionId = watchedSelectedOptionId;
    const selectedOptionConfig = KEY_OPTIONS_CONFIG.find(opt => opt.id === selectedOptionId);
    const optionDisplayNameValue = selectedOptionConfig?.badgeText || "{optionDisplayName}";
    const restrictedToBarretteValue = watchedRestrictedToBarrette ?? "{restrictedToBarrette}";


    const levelToBalanceValue = watchedLevelToBalance;
    const actualLevelDisplay = (levelToBalanceValue === UNSPECIFIED_SELECT_VALUE || !levelToBalanceValue) ? "Non spécifié" : levelToBalanceValue;
    const maxStudentsOfLevelValue = watchedMaxStudentsOfLevel ?? "{maxStudentsOfLevel}";

    const vigilanceToBalanceValue = watchedVigilanceToBalance;
    let actualVigilanceDisplay = "Non spécifié";
    if (vigilanceToBalanceValue === "ROUGE") actualVigilanceDisplay = "Rouge";
    else if (vigilanceToBalanceValue === "ORANGE") actualVigilanceDisplay = "Orange";
    const maxStudentsOfVigilanceValue = watchedMaxStudentsOfVigilance ?? "{maxStudentsOfVigilance}";
    const maxStudentsWithPAPValue = watchedMaxStudentsWithPAP ?? "{maxStudentsWithPAP}";

    if (watchedRuleType === 'OPTION_CLASS_RESTRICTION' && classNameValue === ALL_CLASSES_VALUE) {
        classNameValue = "";
    }

    const isClassNameAllOrEmpty = classNameValue === ALL_CLASSES_VALUE || !classNameValue;

    switch (watchedRuleType) {
      case 'OPTION_BARRETTE_RESTRICTION':
        newMessage = `L'option ${optionDisplayNameValue} est réservée aux classes de la barrette ${restrictedToBarretteValue}.`;
        break;
      case 'NO_STUDENT_NAMED_IN_CLASS':
        if (isClassNameAllOrEmpty) {
          newMessage = `${studentNameValue} ne doit pas être dans une classe de ${targetLevelDisplay}.`;
        } else {
          newMessage = `${studentNameValue} ne doit pas être dans la classe ${classNameValue}.`;
        }
        break;
      case 'OPTION_CLASS_RESTRICTION':
       if ((!classNameValue || classNameValue === ALL_CLASSES_VALUE) && watchedRuleType === 'OPTION_CLASS_RESTRICTION') {
             newMessage = `L'option ${optionDisplayNameValue} ne peut être restreinte qu'à une classe spécifique. Veuillez sélectionner une classe.`;
        }
        else {
            newMessage = `L'option ${optionDisplayNameValue} n'est pas autorisée dans la classe ${classNameValue}.`;
        }
        break;
      case 'BALANCE_LEVEL_IN_CLASS':
        newMessage = `Chaque classe ne doit pas contenir plus de ${maxStudentsOfLevelValue} élèves de niveau ${actualLevelDisplay}.`;
        break;
      case 'BALANCE_VIGILANCE_IN_CLASS':
        newMessage = `Chaque classe ne doit pas contenir plus de ${maxStudentsOfVigilanceValue} élèves avec le code vigilance ${actualVigilanceDisplay}.`;
        break;
      case 'BALANCE_PAP_IN_CLASS':
        newMessage = `Chaque classe ne doit pas contenir plus de ${maxStudentsWithPAPValue} élèves avec un PAP renseigné.`;
        break;
      default:
        newMessage = `L'option ${optionDisplayNameValue} est réservée aux classes de la barrette ${restrictedToBarretteValue}.`; // Default fallback
        break;
    }

    if (currentMessage !== newMessage) {
        addRuleForm.setValue("message", newMessage, { shouldValidate: true, shouldDirty: true });
    }
  }, [
    watchedRuleType,
    watchedRuleStudentName,
    watchedRuleClassName,
    watchedSelectedOptionId,
    watchedRestrictedToBarrette,
    watchedLevelToBalance,
    watchedMaxStudentsOfLevel,
    watchedVigilanceToBalance,
    watchedMaxStudentsOfVigilance,
    watchedMaxStudentsWithPAP,
    addRuleForm,
    targetLevelDisplay
]);

  const checkClassViolations = (students: Student[], currentFutureClasses: FutureClassShell[], currentPlacementRules: PlacementRule[]) => {
    const newViolations: Record<string, ClassViolation> = {};

    currentFutureClasses.forEach(fc => {
      const studentsInThisClass = students.filter(s => s.FUTURE_CLASSE === fc.name);
      const violationMessages: string[] = [];
      const reportedNpmaViolations = new Set<string>();
      const reportedAmaViolations = new Set<string>();

      for (const rule of currentPlacementRules) {
        let personalizedMessage = rule.message;
        switch (rule.type) {
          case 'NO_STUDENT_NAMED_IN_CLASS':
            if ((!rule.className || rule.className.trim() === "" || rule.className === ALL_CLASSES_VALUE) || fc.name === rule.className) {
              const studentNameToFind = rule.studentName ? normalizeString(rule.studentName) : "";
              if (studentNameToFind) {
                  const offendingStudent = studentsInThisClass.find(s =>
                      normalizeString(s.PRENOM) === studentNameToFind ||
                      normalizeString(s.NOM) === studentNameToFind ||
                      normalizeString(`${s.PRENOM} ${s.NOM}`) === studentNameToFind ||
                      normalizeString(`${s.NOM} ${s.PRENOM}`) === studentNameToFind
                  );
                  if (offendingStudent) {
                    personalizedMessage = rule.message
                        .replace(/{studentName}/g, `${offendingStudent.PRENOM} ${offendingStudent.NOM}`);
                    if (rule.className && rule.className !== ALL_CLASSES_VALUE && rule.className.trim() !== "") {
                        personalizedMessage = personalizedMessage.replace(/{className}/g, rule.className);
                    } else {
                         personalizedMessage = personalizedMessage.replace(/{className}/g, `une classe de ${targetLevelDisplay}`);
                    }
                    violationMessages.push(personalizedMessage);
                  }
              }
            }
            break;

          case 'AVOID_NPMA_PAIRING':
            for (let i = 0; i < studentsInThisClass.length; i++) {
              const s1 = studentsInThisClass[i];
              if (s1.NPMA_NOM && s1.NPMA_PRENOM) {
                const s1NpmaNomNormalized = normalizeString(s1.NPMA_NOM);
                const s1NpmaPrenomNormalized = normalizeString(s1.NPMA_PRENOM);

                for (let j = 0; j < studentsInThisClass.length; j++) {
                  if (i === j) continue;

                  const s2 = studentsInThisClass[j];
                  const s2NomNormalized = normalizeString(s2.NOM);
                  const s2PrenomNormalized = normalizeString(s2.PRENOM);

                  if (s1NpmaNomNormalized === s2NomNormalized && s1NpmaPrenomNormalized === s2PrenomNormalized) {
                    const pairKey = [getStudentKey(s1), getStudentKey(s2)].sort().join('-');
                    if (!reportedNpmaViolations.has(pairKey)) {
                      personalizedMessage = rule.message
                        .replace(/{student1Name}/g, `${s1.PRENOM} ${s1.NOM}`)
                        .replace(/{student2Name}/g, `${s2.PRENOM} ${s2.NOM}`);
                      violationMessages.push(personalizedMessage);
                      reportedNpmaViolations.add(pairKey);
                    }
                  }
                }
              }
            }
            break;

          case 'ASSIGN_TOGETHER_AMA':
             studentsInThisClass.forEach(studentInClass => {
                if (studentInClass.AMA_NOM && studentInClass.AMA_PRENOM) {
                    const amaNomNormalized = normalizeString(studentInClass.AMA_NOM);
                    const amaPrenomNormalized = normalizeString(studentInClass.AMA_PRENOM);

                    const partner = allStudents.find(s =>
                        normalizeString(s.NOM) === amaNomNormalized &&
                        normalizeString(s.PRENOM) === amaPrenomNormalized
                    );

                    if (partner && partner.FUTURE_CLASSE !== fc.name) {
                        const pairKey = [getStudentKey(studentInClass), getStudentKey(partner)].sort().join('-');
                         if (!reportedAmaViolations.has(pairKey)) {
                           personalizedMessage = rule.message
                             .replace(/{student1Name}/g, `${studentInClass.PRENOM} ${studentInClass.NOM}`)
                             .replace(/{student2Name}/g, `${partner.PRENOM} ${partner.NOM}`);
                           violationMessages.push(personalizedMessage);
                           reportedAmaViolations.add(pairKey);
                         }
                    }
                }
             });
             allStudents.forEach(studentOutsideClass => {
                if (studentOutsideClass.AMA_NOM && studentOutsideClass.AMA_PRENOM && studentOutsideClass.FUTURE_CLASSE !== fc.name && studentOutsideClass.FUTURE_CLASSE && studentOutsideClass.FUTURE_CLASSE.trim() !== "") {
                    const amaNomNormalized = normalizeString(studentOutsideClass.AMA_NOM);
                    const amaPrenomNormalized = normalizeString(studentOutsideClass.AMA_PRENOM);

                    const partnerInThisClass = studentsInThisClass.find(sInFc =>
                        normalizeString(sInFc.NOM) === amaNomNormalized &&
                        normalizeString(sInFc.PRENOM) === amaPrenomNormalized
                    );

                    if (partnerInThisClass) {
                        const pairKey = [getStudentKey(studentOutsideClass), getStudentKey(partnerInThisClass)].sort().join('-');
                        if (!reportedAmaViolations.has(pairKey)) {
                          personalizedMessage = rule.message
                            .replace(/{student1Name}/g, `${partnerInThisClass.PRENOM} ${partnerInThisClass.NOM}`)
                            .replace(/{student2Name}/g, `${studentOutsideClass.PRENOM} ${studentOutsideClass.NOM}`);
                          violationMessages.push(personalizedMessage);
                          reportedAmaViolations.add(pairKey);
                        }
                    }
                }
             });
             break;

          case 'OPTION_BARRETTE_RESTRICTION':
            if (rule.optionKeywords && rule.optionDisplayName && rule.restrictedToBarrette !== undefined) {
              studentsInThisClass.forEach(student => {
                const studentOptions = [student.OPTION1, student.OPTION2, student.OPTION3]
                  .filter(Boolean)
                  .map(opt => (opt as string).toLowerCase().trim());

                const hasRestrictedOption = rule.optionKeywords!.some(keyword =>
                  studentOptions.some(opt => opt.includes(keyword))
                );

                if (hasRestrictedOption) {
                  if (fc.barrette !== rule.restrictedToBarrette) {
                    personalizedMessage = rule.message
                        .replace(/{optionDisplayName}/g, rule.optionDisplayName!)
                        .replace(/{restrictedToBarrette}/g, rule.restrictedToBarrette!.toString());
                    violationMessages.push(`${student.PRENOM} ${student.NOM} : ${personalizedMessage}`);
                  }
                }
              });
            }
            break;

          case 'OPTION_CLASS_RESTRICTION':
            if (rule.optionKeywords && rule.optionDisplayName && rule.className && rule.className !== ALL_CLASSES_VALUE) {
                if (fc.name === rule.className) {
                    studentsInThisClass.forEach(student => {
                        const studentOptions = [student.OPTION1, student.OPTION2, student.OPTION3]
                            .filter(Boolean)
                            .map(opt => (opt as string).toLowerCase().trim());

                        const hasRestrictedOption = rule.optionKeywords!.some(keyword =>
                            studentOptions.some(opt => opt.includes(keyword))
                        );

                        if (hasRestrictedOption) {
                           personalizedMessage = rule.message
                                .replace(/{optionDisplayName}/g, rule.optionDisplayName!)
                                .replace(/{className}/g, rule.className!);
                           violationMessages.push(`${student.PRENOM} ${student.NOM} : ${personalizedMessage}`);
                        }
                    });
                }
            }
            break;
          case 'BALANCE_LEVEL_IN_CLASS':
            if (rule.levelToBalance !== undefined && rule.maxStudentsOfLevel !== undefined) {
              const studentsOfSpecifiedLevel = studentsInThisClass.filter(s => {
                const studentLevel = s.NIVEAU?.toUpperCase() || "";
                let ruleLevel = (rule.levelToBalance || "").toUpperCase();
                if (ruleLevel === UNSPECIFIED_SELECT_VALUE) ruleLevel = "";
                return studentLevel === ruleLevel;
              });
              if (studentsOfSpecifiedLevel.length > rule.maxStudentsOfLevel) {
                 personalizedMessage = rule.message
                    .replace(/{maxStudentsOfLevel}/g, rule.maxStudentsOfLevel.toString())
                    .replace(/{levelToBalance}/g, rule.levelToBalance && rule.levelToBalance !== UNSPECIFIED_SELECT_VALUE ? rule.levelToBalance : "Non spécifié");
                violationMessages.push(personalizedMessage);
              }
            }
            break;
          case 'BALANCE_VIGILANCE_IN_CLASS':
            if (rule.vigilanceToBalance !== undefined && rule.maxStudentsOfVigilance !== undefined) {
                let targetVigilance = (rule.vigilanceToBalance || "").toUpperCase();
                if (targetVigilance === UNSPECIFIED_SELECT_VALUE) targetVigilance = "";

                const studentsOfSpecifiedVigilance = studentsInThisClass.filter(s => {
                    const studentVigilance = (s.CODE_VIGILANCE || "").toUpperCase();
                    return studentVigilance === targetVigilance;
                });
                if (studentsOfSpecifiedVigilance.length > rule.maxStudentsOfVigilance) {
                    let vigilanceDisplay = "Non spécifié";
                    if (rule.vigilanceToBalance === "ROUGE") vigilanceDisplay = "Rouge";
                    else if (rule.vigilanceToBalance === "ORANGE") vigilanceDisplay = "Orange";

                    personalizedMessage = rule.message
                        .replace(/{maxStudentsOfVigilance}/g, rule.maxStudentsOfVigilance.toString())
                        .replace(/{vigilanceToBalance}/g, vigilanceDisplay);
                    violationMessages.push(personalizedMessage);
                }
            }
            break;
          case 'BALANCE_PAP_IN_CLASS':
            if (rule.maxStudentsWithPAP !== undefined) {
              const studentsWithPAP = studentsInThisClass.filter(s => s.PAP && s.PAP.trim() !== "");
              if (studentsWithPAP.length > rule.maxStudentsWithPAP) {
                personalizedMessage = rule.message
                    .replace(/{maxStudentsWithPAP}/g, rule.maxStudentsWithPAP.toString());
                violationMessages.push(personalizedMessage);
              }
            }
            break;
          }
      }
      newViolations[fc.id] = {
        hasViolation: violationMessages.length > 0,
        messages: violationMessages
      };
    });
    setClassViolations(newViolations);
  };

  useEffect(() => {
    if (allStudents.length > 0 && futureClasses.length > 0 && placementRules.length > 0) {
      checkClassViolations(allStudents, futureClasses, placementRules);
    } else {
      setClassViolations({});
    }
  }, [allStudents, futureClasses, placementRules, targetLevelDisplay]);


  const handleCreateClasses = () => {
    if ((numberOfClassesBarrette1 < 0 || numberOfClassesBarrette1 > 10) || (numberOfClassesBarrette2 < 0 || numberOfClassesBarrette2 > 10)) {
      alert("Veuillez entrer un nombre de classes entre 0 et 10 pour chaque barrette.");
      return;
    }
    if (numberOfClassesBarrette1 === 0 && numberOfClassesBarrette2 === 0) {
        setFutureClasses([]);
        return;
    }

    const newClassShells: FutureClassShell[] = [];
    let classCounter = 0;

    for (let i = 0; i < numberOfClassesBarrette1; i++) {
      classCounter++;
      const className = `${targetLevelDisplay} ${classCounter}`;
      newClassShells.push({
        id: `class-${targetLevelDisplay.replace(/\s+/g, '-')}-b1-${i + 1}`,
        name: className,
        barrette: 1,
      });
    }
    for (let i = 0; i < numberOfClassesBarrette2; i++) {
      classCounter++;
      const className = `${targetLevelDisplay} ${classCounter}`;
      newClassShells.push({
        id: `class-${targetLevelDisplay.replace(/\s+/g, '-')}-b2-${i + 1}`,
        name: className,
        barrette: 2,
      });
    }
    setFutureClasses(newClassShells);
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setCurrentOverDroppableId(null);

    if (!over || !active.id) {
      return;
    }

    const activeStudentKey = active.id as string;

    setAllStudents((prevStudents) => {
        const studentToMoveIndex = prevStudents.findIndex(s => getStudentKey(s) === activeStudentKey);
        if (studentToMoveIndex === -1) {
            return prevStudents;
        }
        const studentToMoveOriginal = { ...prevStudents[studentToMoveIndex] };

        const sourceContainerId = studentToMoveOriginal.FUTURE_CLASSE
            ? futureClasses.find(fc => fc.name === studentToMoveOriginal.FUTURE_CLASSE)?.id ?? UNASSIGNED_CONTAINER_ID
            : UNASSIGNED_CONTAINER_ID;

        const overIsItemInSortable = over.data.current?.sortable;
        const destinationContainerId = overIsItemInSortable ? over.data.current.sortable.containerId : over.id as string;

        let newStudentsState = [...prevStudents];

        if (sourceContainerId === destinationContainerId) {
            if (active.id !== over.id && overIsItemInSortable) {
                const studentsInContainer = newStudentsState.filter(s => {
                    const studentContainerId = s.FUTURE_CLASSE
                        ? futureClasses.find(fc => fc.name === s.FUTURE_CLASSE)?.id ?? UNASSIGNED_CONTAINER_ID
                        : UNASSIGNED_CONTAINER_ID;
                    return studentContainerId === sourceContainerId;
                }).sort((a, b) => { // Maintain current visual order within the container for dndArrayMove
                    const indexA = prevStudents.findIndex(ps => getStudentKey(ps) === getStudentKey(a));
                    const indexB = prevStudents.findIndex(ps => getStudentKey(ps) === getStudentKey(b));
                    return indexA - indexB;
                });


                const oldLocalIndex = studentsInContainer.findIndex(s => getStudentKey(s) === active.id);
                let newLocalIndex = studentsInContainer.findIndex(s => getStudentKey(s) === over.id);

                if (oldLocalIndex !== -1 && newLocalIndex !== -1) {
                   const reorderedStudentsInContainer = dndArrayMove(studentsInContainer, oldLocalIndex, newLocalIndex);

                   // Reconstruct newStudentsState by replacing the students of the current container with the reordered ones
                   let tempStudentState = [...prevStudents];
                   const studentsFromOtherContainers = tempStudentState.filter(s => {
                        const studentContainerId = s.FUTURE_CLASSE ? futureClasses.find(fc => fc.name === s.FUTURE_CLASSE)?.id ?? UNASSIGNED_CONTAINER_ID : UNASSIGNED_CONTAINER_ID;
                        return studentContainerId !== sourceContainerId;
                   });

                   newStudentsState = [...studentsFromOtherContainers, ...reorderedStudentsInContainer];
                   return newStudentsState;
                }
            }
        } else { // Moving to a different container
            const studentToMoveUpdated = { ...studentToMoveOriginal };
            let newFutureClasseName = "";
            if (destinationContainerId === UNASSIGNED_CONTAINER_ID) {
                newFutureClasseName = "";
            } else {
                const targetClassShell = futureClasses.find(fc => fc.id === destinationContainerId);
                if (targetClassShell) {
                    newFutureClasseName = targetClassShell.name;
                } else {
                    return prevStudents; // Should not happen
                }
            }
            studentToMoveUpdated.FUTURE_CLASSE = newFutureClasseName;

            // Remove the student from its old position
            let tempStudentState = prevStudents.filter(s => getStudentKey(s) !== activeStudentKey);

            if (overIsItemInSortable && over.id !== active.id) { // Dropped onto another student in the new container
                const overStudentKey = over.id as string;
                const overStudentGlobalIndex = tempStudentState.findIndex(s => getStudentKey(s) === overStudentKey);
                if (overStudentGlobalIndex !== -1) {
                     tempStudentState.splice(overStudentGlobalIndex, 0, studentToMoveUpdated);
                     return tempStudentState;
                }
            }
            // Dropped onto the container itself or an empty area
            tempStudentState.push(studentToMoveUpdated); // Add to the end of the list (will be visually grouped by FUTURE_CLASSE)
            return tempStudentState;
        }
        return prevStudents;
    });
  }


  const handleResetPlacements = () => {
    setAllStudents(prevStudents => {
      return prevStudents.map(student => {
        const studentSourceLevel = getSourceLevel(targetLevelDisplay);
        if (student.CLASSE.toUpperCase().startsWith(studentSourceLevel) && student.FUTURE_CLASSE.startsWith(targetLevelDisplay)) {
          return { ...student, FUTURE_CLASSE: "" };
        }
        if (student.CLASSE.toUpperCase().startsWith(targetLevelDisplay) && student.FUTURE_CLASSE === "") {
             return { ...student, FUTURE_CLASSE: "" };
        }
        return student;
      });
    });
    setResetConfirmationDialogOpen(false);
  };


  const handleExportCsv = () => {
    if (!allStudents.length) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const activeHeadersSet = new Set<string>();
    const headerOrder: string[] = ["FUTURE_CLASSE"];

    csvHeaders.forEach(header => {
      if (header.toUpperCase() !== "FUTURE_CLASSE") {
        headerOrder.push(header);
      }
      activeHeadersSet.add(header);
    });

    const dynamicHeaders = ["NIVEAU", "OPTION1", "OPTION2", "OPTION3", "NPMA_NOM", "NPMA_PRENOM", "AMA_NOM", "AMA_PRENOM", "CODE_VIGILANCE", "PAP", "COMMENTAIRES"];
    dynamicHeaders.forEach(dh => {
      if (allStudents.some(s => s[dh] && String(s[dh]).trim() !== "")) {
        activeHeadersSet.add(dh);
        if (!headerOrder.includes(dh)) {
          headerOrder.push(dh);
        }
      }
    });

    activeHeadersSet.add("FUTURE_CLASSE");

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headerOrder.map(header => `"${header.replace(/"/g, '""')}"`).join(",") + "\r\n";

    allStudents.forEach(student => {
      const row = headerOrder.map(header => {
        let value = student[header as keyof Student] || "";
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `placements_${targetLevelDisplay.replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddStudentSubmit = (values: AddStudentFormValues) => {
    const newStudent: Student = {
      NOM: values.NOM.toUpperCase(),
      PRENOM: values.PRENOM,
      DATE: values.DATE ? format(values.DATE, "dd/MM/yy") : "",
      SEXE: (values.SEXE === UNSPECIFIED_SELECT_VALUE || !values.SEXE) ? "" : values.SEXE.toUpperCase(),
      CLASSE: sourceLevel,
      OPTION1: "",
      OPTION2: values.OPTION2 || "",
      OPTION3: values.OPTION3 || "",
      NIVEAU: (values.NIVEAU === UNSPECIFIED_SELECT_VALUE || !values.NIVEAU) ? "" : values.NIVEAU.toUpperCase(),
      NPMA_NOM: values.NPMA_NOM || "",
      NPMA_PRENOM: values.NPMA_PRENOM || "",
      AMA_NOM: values.AMA_NOM || "",
      AMA_PRENOM: values.AMA_PRENOM || "",
      FUTURE_CLASSE: "",
      PAP: values.PAP === PAP_VALUE_NONE ? "" : values.PAP,
      COMMENTAIRES: values.COMMENTAIRES || "",
    };
    setAllStudents(prev => [...prev, newStudent]);
    setAddStudentDialogOpen(false);
    addStudentForm.reset({ NOM: "", PRENOM: "", DATE: undefined, SEXE: UNSPECIFIED_SELECT_VALUE, NIVEAU: UNSPECIFIED_SELECT_VALUE, NPMA_NOM: "", NPMA_PRENOM: "", AMA_NOM: "", AMA_PRENOM: "", OPTION2: "", OPTION3: "", PAP: PAP_VALUE_NONE, COMMENTAIRES: "" });
  };

  const handleOpenEditDialog = (student: Student) => {
    setEditingStudentKey(getStudentKey(student));
    setEditStudentDialogOpen(true);
  };

  const handleOpenStudentDetailsDialog = (student: Student) => {
    setViewingStudentDetailsKey(getStudentKey(student));
    setStudentDetailsDialogOpen(true);
  };

  const handleEditStudentSubmit = (values: EditStudentFormValues) => {
    if (!editingStudentKey) return;

    setAllStudents(prevStudents =>
      prevStudents.map(student => {
        if (getStudentKey(student) === editingStudentKey) {
          return {
            ...student,
            NOM: values.NOM.toUpperCase(),
            PRENOM: values.PRENOM,
            DATE: values.DATE ? format(values.DATE, "dd/MM/yy") : "",
            SEXE: (values.SEXE === UNSPECIFIED_SELECT_VALUE || !values.SEXE) ? "" : values.SEXE.toUpperCase(),
            NIVEAU: (values.NIVEAU === UNSPECIFIED_SELECT_VALUE || !values.NIVEAU) ? "" : values.NIVEAU.toUpperCase(),
            CODE_VIGILANCE: (values.CODE_VIGILANCE === UNSPECIFIED_SELECT_VALUE || !values.CODE_VIGILANCE) ? "" : values.CODE_VIGILANCE.toUpperCase(),
            OPTION1: values.OPTION1 || "",
            OPTION2: values.OPTION2 || "",
            OPTION3: values.OPTION3 || "",
            NPMA_NOM: values.NPMA_NOM || "",
            NPMA_PRENOM: values.NPMA_PRENOM || "",
            AMA_NOM: values.AMA_NOM || "",
            AMA_PRENOM: values.AMA_PRENOM || "",
            PAP: values.PAP === PAP_VALUE_NONE ? "" : values.PAP,
            COMMENTAIRES: values.COMMENTAIRES || "",
          };
        }
        return student;
      })
    );
    setEditStudentDialogOpen(false);
    setEditingStudentKey(null);
    editStudentForm.reset({ NOM: "", PRENOM: "", DATE: undefined, SEXE: UNSPECIFIED_SELECT_VALUE, NIVEAU: UNSPECIFIED_SELECT_VALUE, CODE_VIGILANCE: UNSPECIFIED_SELECT_VALUE, OPTION1: "", OPTION2: "", OPTION3: "", NPMA_NOM: "", NPMA_PRENOM: "", AMA_NOM: "", AMA_PRENOM: "", PAP: PAP_VALUE_NONE, COMMENTAIRES: "" });
  };

  const handleAddRepeater = () => {
    if (!selectedRepeaterKey) return;
    const studentData = allStudents.find(s => getStudentKey(s) === selectedRepeaterKey);

    if (studentData) {
      setAllStudents(prevStudents => {
        const studentOriginalKey = getStudentKey(studentData);

        const repeaterStudentData: Student = {
          ...studentData,
          CLASSE: sourceLevel,
          FUTURE_CLASSE: "",
        };

        const existingStudentIndex = prevStudents.findIndex(s => getStudentKey(s) === studentOriginalKey);

        if (existingStudentIndex !== -1) {
          const updatedStudents = [...prevStudents];
          updatedStudents[existingStudentIndex] = repeaterStudentData;
          return updatedStudents;
        } else {
          console.warn("Could not find student to update for repeater. This might indicate an issue with student keys or selection logic.");
          return prevStudents;
        }
      });
    }
    setAddRepeaterDialogOpen(false);
    setRepeaterSearchTerm("");
    setSelectedRepeaterKey(null);
  };


  const handleAddRuleSubmit = (values: AddRuleFormValues) => {
    const newRule: PlacementRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: values.type,
      message: values.message,
    };

    const selectedOptionConfig = KEY_OPTIONS_CONFIG.find(opt => opt.id === values.selectedOptionId);
    let finalMessage = values.message;

    if (values.type === 'OPTION_BARRETTE_RESTRICTION' || values.type === 'OPTION_CLASS_RESTRICTION') {
        if (selectedOptionConfig) {
            newRule.optionKeywords = selectedOptionConfig.keywords;
            newRule.optionDisplayName = selectedOptionConfig.badgeText;
        } else {
            newRule.optionKeywords = [];
            newRule.optionDisplayName = 'Option non spécifiée';
        }

        if (values.type === 'OPTION_BARRETTE_RESTRICTION') {
            newRule.restrictedToBarrette = values.restrictedToBarrette || 1;
        } else {
            newRule.className = values.className;
        }
    } else if (values.type === 'NO_STUDENT_NAMED_IN_CLASS') {
        newRule.studentName = values.studentName || "";
        newRule.className = (values.className === ALL_CLASSES_VALUE || !values.className) ? "" : values.className;
    } else if (values.type === 'BALANCE_LEVEL_IN_CLASS') {
        newRule.levelToBalance = (values.levelToBalance === UNSPECIFIED_SELECT_VALUE || !values.levelToBalance) ? "" : values.levelToBalance;
        newRule.maxStudentsOfLevel = values.maxStudentsOfLevel;
    } else if (values.type === 'BALANCE_VIGILANCE_IN_CLASS') {
        newRule.vigilanceToBalance = (values.vigilanceToBalance === UNSPECIFIED_SELECT_VALUE || !values.vigilanceToBalance) ? "" : values.vigilanceToBalance;
        newRule.maxStudentsOfVigilance = values.maxStudentsOfVigilance;
    } else if (values.type === 'BALANCE_PAP_IN_CLASS') {
        newRule.maxStudentsWithPAP = values.maxStudentsWithPAP;
    }

    newRule.message = finalMessage;

    setPlacementRules(prevRules => [...prevRules, newRule]);
    setAddRuleDialogOpen(false);
    addRuleForm.reset({
        type: 'OPTION_BARRETTE_RESTRICTION',
        message: "L'option {optionDisplayName} est réservée aux classes de la barrette {restrictedToBarrette}.",
        selectedOptionId: "",
        restrictedToBarrette: 1,
        studentName: "",
        className: ALL_CLASSES_VALUE,
        levelToBalance: UNSPECIFIED_SELECT_VALUE,
        maxStudentsOfLevel: 1,
        vigilanceToBalance: UNSPECIFIED_SELECT_VALUE,
        maxStudentsOfVigilance: 1,
        maxStudentsWithPAP: 1,
    });
  };

  const handleDeleteRule = () => {
    if (ruleToDeleteId) {
      setPlacementRules(prevRules => prevRules.filter(rule => rule.id !== ruleToDeleteId));
      setRuleToDeleteId(null);
    }
  };

  const getRuleDescription = (rule: PlacementRule): string => {
    switch (rule.type) {
      case 'AVOID_NPMA_PAIRING':
        return "NPMA : " + rule.message.replace(/{student1Name}/g, "Élève1").replace(/{student2Name}/g, "Élève2");
      case 'OPTION_BARRETTE_RESTRICTION':
        return `Option '${rule.optionDisplayName || 'N/A'}' restreinte à Barrette ${rule.restrictedToBarrette || 'N/A'}.`;
      case 'NO_STUDENT_NAMED_IN_CLASS':
        const targetClassDesc = (rule.className && rule.className !== ALL_CLASSES_VALUE && rule.className.trim() !== "") ? `classe '${rule.className}'` : `toutes classes de ${targetLevelDisplay}`;
        return `Élève '${rule.studentName || 'N/A'}' interdit dans ${targetClassDesc}.`;
      case 'ASSIGN_TOGETHER_AMA':
         return "AMA : " + rule.message.replace(/{student1Name}/g, "Élève1").replace(/{student2Name}/g, "Élève2");
      case 'OPTION_CLASS_RESTRICTION':
        const classNameForDesc = rule.className && rule.className !== ALL_CLASSES_VALUE && rule.className.trim() !== "" ? `'${rule.className}'` : `(classe non spécifiée)`;
        return `Option '${rule.optionDisplayName || 'N/A'}' interdite dans la classe ${classNameForDesc}.`;
      case 'BALANCE_LEVEL_IN_CLASS':
        return `Max ${rule.maxStudentsOfLevel ?? 'N/A'} élèves de niveau '${rule.levelToBalance || 'Non spécifié'}' par classe.`;
      case 'BALANCE_VIGILANCE_IN_CLASS':
        const vigilanceDesc = rule.vigilanceToBalance ? rule.vigilanceToBalance.charAt(0).toUpperCase() + rule.vigilanceToBalance.slice(1).toLowerCase() : "Non spécifié";
        return `Max ${rule.maxStudentsOfVigilance ?? 'N/A'} élèves avec code vigilance '${vigilanceDesc}' par classe.`;
      case 'BALANCE_PAP_IN_CLASS':
        return `Max ${rule.maxStudentsWithPAP ?? 'N/A'} élèves avec un PAP par classe.`;
      default:
        return "Règle inconnue.";
    }
  };

  const handleFilterChange = (type: keyof Omit<FilterState, 'options'>, value: string | null) => {
    setActiveFilters(prev => {
      const currentFilterValue = prev[type as keyof Pick<FilterState, 'niveau' | 'pap' | 'vigilance'>];
      const newFilterValue = currentFilterValue === value ? null : value;
      return { ...prev, [type]: newFilterValue };
    });
  };

  const handleOptionFilterChange = (optionId: string) => {
    setActiveFilters(prev => {
      const newOptions = prev.options.includes(optionId)
        ? prev.options.filter(id => id !== optionId)
        : [...prev.options, optionId];
      return { ...prev, options: newOptions };
    });
  };

  const resetFilters = () => {
    setActiveFilters({ niveau: null, pap: null, options: [], vigilance: null });
  };

  const MAX_STUDENTS_PER_CLASS = 30;
  const ADDITIONAL_GENDER_DIFFERENCE_MARGIN = 1; 

  const violatesHardConstraints = (
    student: Student,
    candidateClass: FutureClassShell,
    studentsInCandidateClass: Student[],
    allRules: PlacementRule[],
    currentClassCount: number,
    maxAllowedAbsoluteGenderDifference: number
  ): boolean => {
    if (currentClassCount >= MAX_STUDENTS_PER_CLASS) {
      return true;
    }

    let projectedBoys = studentsInCandidateClass.filter(s => s.SEXE === "MASCULIN").length;
    let projectedGirls = studentsInCandidateClass.filter(s => s.SEXE === "FÉMININ" || s.SEXE === "FEMININ").length;

    if (student.SEXE === "MASCULIN") {
      projectedBoys++;
    } else if (student.SEXE === "FÉMININ" || student.SEXE === "FEMININ") {
      projectedGirls++;
    }
    if (student.SEXE && (student.SEXE === "MASCULIN" || student.SEXE === "FÉMININ" || student.SEXE === "FEMININ")) {
        const absoluteGenderDifference = Math.abs(projectedBoys - projectedGirls);
        if (absoluteGenderDifference > maxAllowedAbsoluteGenderDifference) {
          return true;
        }
    }


    for (const rule of allRules) {
      switch (rule.type) {
        case 'NO_STUDENT_NAMED_IN_CLASS':
          if ((!rule.className || rule.className.trim() === "" || rule.className === ALL_CLASSES_VALUE) || candidateClass.name === rule.className) {
            const studentNameToFind = rule.studentName ? normalizeString(rule.studentName) : "";
            if (studentNameToFind && (
                normalizeString(student.PRENOM) === studentNameToFind ||
                normalizeString(student.NOM) === studentNameToFind ||
                normalizeString(`${student.PRENOM} ${student.NOM}`) === studentNameToFind ||
                normalizeString(`${student.NOM} ${student.PRENOM}`) === studentNameToFind
            )) {
              return true;
            }
          }
          break;
        case 'AVOID_NPMA_PAIRING':
          if (student.NPMA_NOM && student.NPMA_PRENOM) {
            const npmaNomNorm = normalizeString(student.NPMA_NOM);
            const npmaPrenomNorm = normalizeString(student.NPMA_PRENOM);
            if (studentsInCandidateClass.some(s => normalizeString(s.NOM) === npmaNomNorm && normalizeString(s.PRENOM) === npmaPrenomNorm)) {
              return true;
            }
          }
          break;
        case 'OPTION_BARRETTE_RESTRICTION':
          if (rule.optionKeywords && rule.restrictedToBarrette !== undefined) {
            const studentOptions = [student.OPTION1, student.OPTION2, student.OPTION3].filter(Boolean).map(opt => (opt as string).toLowerCase().trim());
            const hasRestrictedOption = rule.optionKeywords.some(keyword => studentOptions.some(opt => opt.includes(keyword)));
            if (hasRestrictedOption && candidateClass.barrette !== rule.restrictedToBarrette) {
              return true;
            }
          }
          break;
        case 'OPTION_CLASS_RESTRICTION':
          if (rule.optionKeywords && rule.className && rule.className !== ALL_CLASSES_VALUE) {
            if (candidateClass.name === rule.className) {
              const studentOptions = [student.OPTION1, student.OPTION2, student.OPTION3].filter(Boolean).map(opt => (opt as string).toLowerCase().trim());
              const hasRestrictedOption = rule.optionKeywords.some(keyword => studentOptions.some(opt => opt.includes(keyword)));
              if (hasRestrictedOption) {
                return true;
              }
            }
          }
          break;
        case 'BALANCE_LEVEL_IN_CLASS':
          if (rule.levelToBalance !== undefined && rule.maxStudentsOfLevel !== undefined) {
            let ruleLevel = (rule.levelToBalance || "").toUpperCase();
            if (ruleLevel === UNSPECIFIED_SELECT_VALUE) ruleLevel = "";
            if ((student.NIVEAU?.toUpperCase() || "") === ruleLevel) {
              const count = studentsInCandidateClass.filter(s => (s.NIVEAU?.toUpperCase() || "") === ruleLevel).length;
              if (count + 1 > rule.maxStudentsOfLevel) return true;
            }
          }
          break;
        case 'BALANCE_VIGILANCE_IN_CLASS':
          if (rule.vigilanceToBalance !== undefined && rule.maxStudentsOfVigilance !== undefined) {
              let targetVigilance = (rule.vigilanceToBalance || "").toUpperCase();
              if (targetVigilance === UNSPECIFIED_SELECT_VALUE) targetVigilance = "";
               if ((student.CODE_VIGILANCE || "").toUpperCase() === targetVigilance) {
                  const count = studentsInCandidateClass.filter(s => (s.CODE_VIGILANCE || "").toUpperCase() === targetVigilance).length;
                  if (count + 1 > rule.maxStudentsOfVigilance) return true;
               }
          }
          break;
        case 'BALANCE_PAP_IN_CLASS':
          if (rule.maxStudentsWithPAP !== undefined) {
            if (student.PAP && student.PAP.trim() !== "") {
              const count = studentsInCandidateClass.filter(s => s.PAP && s.PAP.trim() !== "").length;
              if (count + 1 > rule.maxStudentsWithPAP) return true;
            }
          }
          break;
      }
    }
    return false;
  };

  const calculatePlacementScore = (
    student: Student,
    candidateClass: FutureClassShell,
    studentsInCandidateClass: Student[],
    allRules: PlacementRule[],
    entireStudentPopulation: Student[], 
    globalBoyRatio: number,
    globalGirlRatio: number
  ): number => {
    let score = 0;

    if (student.AMA_NOM && student.AMA_PRENOM) {
      const amaNomNorm = normalizeString(student.AMA_NOM);
      const amaPrenomNorm = normalizeString(student.AMA_PRENOM);
      const amaPartner = entireStudentPopulation.find(s => normalizeString(s.NOM) === amaNomNorm && normalizeString(s.PRENOM) === amaPrenomNorm);

      if (amaPartner) {
        if (studentsInCandidateClass.some(s => getStudentKey(s) === getStudentKey(amaPartner))) {
          score += 200;
        } else if (amaPartner.FUTURE_CLASSE && amaPartner.FUTURE_CLASSE.trim() !== "" && amaPartner.FUTURE_CLASSE !== candidateClass.name) {
          score -= 150;
        } else if (amaPartner.FUTURE_CLASSE === candidateClass.name) {
           score += 200;
        } else {
          score += 20;
        }
      }
    }

    score -= studentsInCandidateClass.length * 2; 

    const projectedClassSize = studentsInCandidateClass.length + 1;

    let currentBoysInClass = studentsInCandidateClass.filter(s => s.SEXE === "MASCULIN").length;
    let currentGirlsInClass = studentsInCandidateClass.filter(s => s.SEXE === "FÉMININ" || s.SEXE === "FEMININ").length;

    let projectedBoysAfterAdd = currentBoysInClass;
    let projectedGirlsAfterAdd = currentGirlsInClass;

    if (student.SEXE === "MASCULIN") {
      projectedBoysAfterAdd++;
    } else if (student.SEXE === "FÉMININ" || student.SEXE === "FEMININ") {
      projectedGirlsAfterAdd++;
    }

    if (student.SEXE && (student.SEXE === "MASCULIN" || student.SEXE === "FÉMININ" || student.SEXE === "FEMININ") && (globalBoyRatio > 0 || globalGirlRatio > 0) && projectedClassSize > 0) {
        const projectedBoyRatioInClass = projectedBoysAfterAdd / projectedClassSize;
        const projectedGirlRatioInClass = projectedGirlsAfterAdd / projectedClassSize;

        const boyDeviation = Math.abs(projectedBoyRatioInClass - globalBoyRatio);
        const girlDeviation = Math.abs(projectedGirlRatioInClass - globalGirlRatio);
        score -= (boyDeviation + girlDeviation) * 8.0; 
    }


    const studentLevel = student.NIVEAU?.toUpperCase() || "unspecified";
    const countOfStudentLevelInClass = studentsInCandidateClass.filter(s => (s.NIVEAU?.toUpperCase() || "unspecified") === studentLevel).length;
    score -= (countOfStudentLevelInClass + 1) * 3; 

    let numRougeInClass = studentsInCandidateClass.filter(s => s.CODE_VIGILANCE === "ROUGE").length;
    let numOrangeInClass = studentsInCandidateClass.filter(s => s.CODE_VIGILANCE === "ORANGE").length;
    if (student.CODE_VIGILANCE === "ROUGE") numRougeInClass++;
    if (student.CODE_VIGILANCE === "ORANGE") numOrangeInClass++;
    score -= numRougeInClass * 10;
    score -= numOrangeInClass * 5;

    let numPapInClass = studentsInCandidateClass.filter(s => s.PAP && s.PAP.trim() !== "").length;
    if (student.PAP && student.PAP.trim() !== "") numPapInClass++;
    score -= numPapInClass * 4;

    return score;
  };


  const handleAutomaticPlacement = async () => {
    setIsAutoPlacing(true);
    toast({ title: "Répartition en cours...", description: "Veuillez patienter, cela peut prendre un moment." });

    const studentsToAssignInitial = allStudents.filter(
        (s) => s.CLASSE.toUpperCase().startsWith(sourceLevel) &&
               (!s.FUTURE_CLASSE || s.FUTURE_CLASSE.trim() === "") &&
               (s.NIVEAU && s.NIVEAU.trim() !== "") 
    );

    const availableClasses = [...futureClasses];

    if (studentsToAssignInitial.length === 0) {
      toast({ title: "Répartition", description: "Aucun élève (avec niveau spécifié) à placer pour ce niveau source.", variant: "default" });
      setIsAutoPlacing(false);
      return;
    }
    if (availableClasses.length === 0) {
      toast({ title: "Répartition", description: "Aucune classe future n'a été créée.", variant: "destructive" });
      setIsAutoPlacing(false);
      return;
    }

    let workingStudentList = JSON.parse(JSON.stringify(allStudents)) as Student[];

    const classCounts = new Map<string, number>();
    availableClasses.forEach(fc => {
      classCounts.set(fc.name, workingStudentList.filter(s => s.FUTURE_CLASSE === fc.name).length);
    });

    const totalBoysToAssign = studentsToAssignInitial.filter(s => s.SEXE === "MASCULIN").length;
    const totalGirlsToAssign = studentsToAssignInitial.filter(s => s.SEXE === "FÉMININ" || s.SEXE === "FEMININ").length;
    const totalStudentsWithGenderToAssign = totalBoysToAssign + totalGirlsToAssign;

    const globalBoyRatio = totalStudentsWithGenderToAssign > 0 ? totalBoysToAssign / totalStudentsWithGenderToAssign : 0.5;
    const globalGirlRatio = totalStudentsWithGenderToAssign > 0 ? totalGirlsToAssign / totalStudentsWithGenderToAssign : 0.5;

    let calculatedMaxAllowedAbsoluteGenderDifference = 5; 
    if (availableClasses.length > 0 && totalStudentsWithGenderToAssign > 0) {
        const globalGenderDifferenceUnsigned = Math.abs(totalBoysToAssign - totalGirlsToAssign);
        const naturalDifferencePerClass = Math.ceil(globalGenderDifferenceUnsigned / availableClasses.length);
        calculatedMaxAllowedAbsoluteGenderDifference = naturalDifferencePerClass + ADDITIONAL_GENDER_DIFFERENCE_MARGIN;
    }


    let studentsPlacedCount = 0;
    const studentsNotPlaced: Student[] = [];

    const studentsToAssign = [...studentsToAssignInitial].sort((a, b) => {
        const aAmaPartnerKey = (a.AMA_NOM && a.AMA_PRENOM) ? `${normalizeString(a.AMA_NOM)}-${normalizeString(a.AMA_PRENOM)}` : null;
        const bAmaPartnerKey = (b.AMA_NOM && b.AMA_PRENOM) ? `${normalizeString(b.AMA_NOM)}-${normalizeString(b.AMA_PRENOM)}` : null;

        const aPartner = aAmaPartnerKey ? workingStudentList.find(s => `${normalizeString(s.NOM)}-${normalizeString(s.PRENOM)}` === aAmaPartnerKey) : null;
        const bPartner = bAmaPartnerKey ? workingStudentList.find(s => `${normalizeString(s.NOM)}-${normalizeString(s.PRENOM)}` === bAmaPartnerKey) : null;

        const aAmaPartnerPlaced = aPartner && aPartner.FUTURE_CLASSE && aPartner.FUTURE_CLASSE.trim() !== "";
        const bAmaPartnerPlaced = bPartner && bPartner.FUTURE_CLASSE && bPartner.FUTURE_CLASSE.trim() !== "";

        if (aAmaPartnerPlaced && !bAmaPartnerPlaced) return -1; 
        if (!aAmaPartnerPlaced && bAmaPartnerPlaced) return 1;  

        const niveauOrder: Record<string, number> = { D: 1, C: 2, B: 3, A: 4 };
        const aNiveauSort = niveauOrder[a.NIVEAU?.toUpperCase() || ""] || 5; 
        const bNiveauSort = niveauOrder[b.NIVEAU?.toUpperCase() || ""] || 5;
        if (aNiveauSort !== bNiveauSort) return aNiveauSort - bNiveauSort;

        return 0; 
    });


    for (const student of studentsToAssign) {
      const studentInWorkingListIndex = workingStudentList.findIndex(s => getStudentKey(s) === getStudentKey(student));
      if (studentInWorkingListIndex === -1) continue; 

      if (workingStudentList[studentInWorkingListIndex].FUTURE_CLASSE && workingStudentList[studentInWorkingListIndex].FUTURE_CLASSE.trim() !== "") {
          continue;
      }


      let bestCandidateClass: FutureClassShell | null = null;
      let highestScore = -Infinity;
      let placedInThisIteration = false;

      const shuffledClasses = [...availableClasses].sort(() => Math.random() - 0.5);

      for (const candidateClass of shuffledClasses) {
        const currentClassCount = classCounts.get(candidateClass.name) || 0;
        const studentsCurrentlyInThisCandidateClass = workingStudentList.filter(s => s.FUTURE_CLASSE === candidateClass.name);

        if (violatesHardConstraints(
            workingStudentList[studentInWorkingListIndex], 
            candidateClass,
            studentsCurrentlyInThisCandidateClass,
            placementRules,
            currentClassCount,
            calculatedMaxAllowedAbsoluteGenderDifference
            )) {
          continue;
        }

        const score = calculatePlacementScore(
            workingStudentList[studentInWorkingListIndex], 
            candidateClass,
            studentsCurrentlyInThisCandidateClass,
            placementRules,
            workingStudentList, 
            globalBoyRatio,
            globalGirlRatio
        );

        if (score > highestScore) {
          highestScore = score;
          bestCandidateClass = candidateClass;
        }
      }

      if (bestCandidateClass) {
        workingStudentList[studentInWorkingListIndex].FUTURE_CLASSE = bestCandidateClass.name;
        classCounts.set(bestCandidateClass.name, (classCounts.get(bestCandidateClass.name) || 0) + 1);
        studentsPlacedCount++;
        placedInThisIteration = true;

        const amaNomNorm = normalizeString(student.AMA_NOM);
        const amaPrenomNorm = normalizeString(student.AMA_PRENOM);
        if (student.AMA_NOM && student.AMA_PRENOM) {
            const partnerIndex = workingStudentList.findIndex(s =>
                normalizeString(s.NOM) === amaNomNorm &&
                normalizeString(s.PRENOM) === amaPrenomNorm &&
                (!s.FUTURE_CLASSE || s.FUTURE_CLASSE.trim() === "") 
            );
            if (partnerIndex !== -1) {
                 const partner = workingStudentList[partnerIndex];
                 const partnerCurrentClassCount = classCounts.get(bestCandidateClass.name) || 0; 
                 const studentsInPartnersCandidateClass = workingStudentList.filter(s => s.FUTURE_CLASSE === bestCandidateClass!.name); 

                 if (!violatesHardConstraints(
                    partner,
                    bestCandidateClass,
                    studentsInPartnersCandidateClass, 
                    placementRules,
                    partnerCurrentClassCount, 
                    calculatedMaxAllowedAbsoluteGenderDifference
                    )) {
                    workingStudentList[partnerIndex].FUTURE_CLASSE = bestCandidateClass.name;
                    classCounts.set(bestCandidateClass.name, (classCounts.get(bestCandidateClass.name) || 0) + 1);
                 }
            }
        }
      }

      if (!placedInThisIteration) {
        studentsNotPlaced.push(student);
      }
    }

    setAllStudents(workingStudentList);

    for (const fc of availableClasses) {
      handleReorderStudentsInClass(fc.name);
    }

    setIsAutoPlacing(false);
    let toastDescription = `${studentsPlacedCount} sur ${studentsToAssign.length} élèves ont été répartis.`;
    if (studentsNotPlaced.length > 0) {
        toastDescription += ` ${studentsNotPlaced.length} élève(s) n'a/ont pas pu être réparti(s) automatiquement (contraintes ou classes pleines).`;
    }
    toast({
      title: "Répartition Automatique Terminée",
      description: toastDescription + " Veuillez vérifier et ajuster les résultats.",
    });
  };

  const getNiveauSortOrder = (niveau?: string): number => {
    const upperNiveau = niveau?.toUpperCase();
    if (upperNiveau === "A") return 1;
    if (upperNiveau === "B") return 2;
    if (upperNiveau === "C") return 3;
    if (upperNiveau === "D") return 4;
    return 5; // Unspecified or other
  };

  const handleReorderStudentsInClass = (className: string) => {
    setAllStudents(prevStudents => {
      const studentsInTargetClass = prevStudents.filter(s => s.FUTURE_CLASSE === className);
      const otherStudents = prevStudents.filter(s => s.FUTURE_CLASSE !== className);

      studentsInTargetClass.sort((a, b) => {
        const orderA = getNiveauSortOrder(a.NIVEAU);
        const orderB = getNiveauSortOrder(b.NIVEAU);
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        const nomCompare = normalizeString(a.NOM).localeCompare(normalizeString(b.NOM));
        if (nomCompare !== 0) {
          return nomCompare;
        }
        return normalizeString(a.PRENOM).localeCompare(normalizeString(b.PRENOM));
      });

      return [...otherStudents, ...studentsInTargetClass];
    });
  };

  const handleGenerateReport = () => {
    if (futureClasses.length === 0) {
      toast({ title: "Rapport", description: "Aucune classe future n'a été créée pour générer un rapport.", variant: "default" });
      return;
    }

    const studentsInFutureClassesForThisLevel = allStudents.filter(s =>
      futureClasses.some(fc => fc.name === s.FUTURE_CLASSE)
    );

    const totalBoysInScope = studentsInFutureClassesForThisLevel.filter(s => s.SEXE === "MASCULIN").length;
    const totalGirlsInScope = studentsInFutureClassesForThisLevel.filter(s => s.SEXE === "FÉMININ" || s.SEXE === "FEMININ").length;
    const totalStudentsWithGenderInScope = totalBoysInScope + totalGirlsInScope;

    const reportGlobalBoyRatio = totalStudentsWithGenderInScope > 0 ? totalBoysInScope / totalStudentsWithGenderInScope : 0.5;
    const reportGlobalGirlRatio = totalStudentsWithGenderInScope > 0 ? totalGirlsInScope / totalStudentsWithGenderInScope : 0.5;

    const newReportData = futureClasses.map(fc => {
      const studentsInThisClass = allStudents.filter(s => s.FUTURE_CLASSE === fc.name);
      const violationForThisClass = classViolations[fc.id] || { hasViolation: false, messages: [] }; 
      return calculateClassScoreAndDetails(
        fc,
        studentsInThisClass,
        allStudents, 
        placementRules,
        reportGlobalBoyRatio,
        reportGlobalGirlRatio,
        violationForThisClass 
      );
    });

    newReportData.sort((a, b) => b.score - a.score); 

    setReportData(newReportData);
    setReportDialogOpen(true);
  };


  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <p>Chargement des données...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col bg-background p-4 space-y-4">
         <div className="w-full max-w-4xl mx-auto space-y-4">
            <Link href="/" passHref>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Button>
            </Link>
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Erreur</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
              </CardContent>
            </Card>
         </div>
      </main>
    );
  }


  return (
    <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={(event: DragOverEvent) => {
          const { over } = event;
          if (over) {
            const droppableId = over.data.current?.sortable?.containerId ?? over.id;
            setCurrentOverDroppableId(droppableId);
          } else {
            setCurrentOverDroppableId(null);
          }
        }}
        onDragEnd={handleDragEnd}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
    <main className="flex min-h-screen flex-col bg-background space-y-4 p-4">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border border-border rounded-lg shadow bg-card">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <Link href="/" passHref>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Accueil
              </Button>
            </Link>
            <div>
                <h1 className="text-lg sm:text-xl font-semibold text-primary truncate">Placement: {targetLevelDisplay}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Source: {sourceLevel}</p>
            </div>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1">
              <Label htmlFor="num-classes-b1" className="text-sm sm:text-base font-semibold text-muted-foreground shrink-0">B1:</Label>
              <Input
                id="num-classes-b1"
                type="number"
                min="0"
                max="10"
                value={numberOfClassesBarrette1}
                onChange={(e) => setNumberOfClassesBarrette1(parseInt(e.target.value, 10))}
                className="h-8 w-16 sm:w-20"
              />
            </div>
            <div className="flex items-center gap-1">
              <Label htmlFor="num-classes-b2" className="text-sm sm:text-base font-semibold text-muted-foreground shrink-0">B2:</Label>
              <Input
                id="num-classes-b2"
                type="number"
                min="0"
                max="10"
                value={numberOfClassesBarrette2}
                onChange={(e) => setNumberOfClassesBarrette2(parseInt(e.target.value, 10))}
                className="h-8 w-16 sm:w-20"
              />
            </div>
             <Button onClick={handleCreateClasses} size="sm">
                <PlusCircle className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-4 sm:w-4"/>
                Créer / MàJ
            </Button>


            <div className="relative flex items-center">
                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="search-students"
                  type="text"
                  placeholder="Rechercher (Nom, Prénom, Niveau, Option)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-7 pr-7 w-36 sm:w-48"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchTerm("")}
                    aria-label="Effacer la recherche"
                  >
                    <XIcon size={14} />
                  </Button>
                )}
            </div>

            <Button onClick={handleAutomaticPlacement} variant="outline" size="sm" disabled={isAutoPlacing || studentsToPlace.filter(s => s.NIVEAU && s.NIVEAU.trim() !== "").length === 0 || futureClasses.length === 0}>
                <Wand2 className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-4 sm:w-4"/>
                {isAutoPlacing ? "Répartition..." : "Répartir"}
            </Button>

            <Button onClick={handleGenerateReport} variant="outline" size="sm">
              <ScrollText className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-4 sm:w-4"/>
              Rapport
            </Button>

            <Dialog open={isManageRulesDialogOpen} onOpenChange={setManageRulesDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-4 sm:w-4"/>
                  Gérer les Règles
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Gestion des Règles de Placement</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-2 pr-2 space-y-3">
                  <Dialog open={isAddRuleDialogOpen} onOpenChange={setAddRuleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mb-3"><PlusCircle className="mr-2 h-4 w-4" />Ajouter une Règle</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Ajouter une Nouvelle Règle</DialogTitle>
                      </DialogHeader>
                      <Form {...addRuleForm}>
                        <form id="add-rule-form" onSubmit={addRuleForm.handleSubmit(handleAddRuleSubmit)} className="space-y-4 py-4">
                          <FormField
                            control={addRuleForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type de Règle</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Choisir un type..." /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {userConfigurableRuleTypes.map(option => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {(watchedRuleType === 'OPTION_BARRETTE_RESTRICTION' || watchedRuleType === 'OPTION_CLASS_RESTRICTION') && (
                            <FormField
                              control={addRuleForm.control}
                              name="selectedOptionId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sélectionner une Option</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choisir une option..." />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {relevantOptionsForRules.length === 0 && <SelectItem value="no-options-found" disabled>Aucune option pertinente trouvée</SelectItem>}
                                      {relevantOptionsForRules.map(optionConfig => (
                                        <SelectItem key={optionConfig.id} value={optionConfig.id}>
                                          {optionConfig.badgeText}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {watchedRuleType === 'OPTION_BARRETTE_RESTRICTION' && (
                            <FormField control={addRuleForm.control} name="restrictedToBarrette" render={({ field }) => (<FormItem><FormLabel>Restreindre à la Barrette</FormLabel><Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={field.value?.toString() || "1"}><FormControl><SelectTrigger><SelectValue placeholder="Choisir barrette..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="1">Barrette 1</SelectItem><SelectItem value="2">Barrette 2</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                          )}

                          {(watchedRuleType === 'NO_STUDENT_NAMED_IN_CLASS' || watchedRuleType === 'OPTION_CLASS_RESTRICTION') && (
                              <>
                                  {watchedRuleType === 'NO_STUDENT_NAMED_IN_CLASS' && (
                                      <FormField control={addRuleForm.control} name="studentName" render={({ field }) => (<FormItem><FormLabel>Nom ou Prénom de l'Élève Interdit</FormLabel><FormControl><Input placeholder="Ex: Toto" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                  )}
                                  <FormField
                                    control={addRuleForm.control}
                                    name="className"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Nom de la Classe</FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          value={field.value || (watchedRuleType === 'OPTION_CLASS_RESTRICTION' && futureClasses.length > 0 ? futureClasses[0].name : ALL_CLASSES_VALUE)}
                                          disabled={watchedRuleType === 'OPTION_CLASS_RESTRICTION' && futureClasses.length === 0}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Sélectionner une classe..." />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {watchedRuleType === 'NO_STUDENT_NAMED_IN_CLASS' && (
                                                <SelectItem value={ALL_CLASSES_VALUE}>
                                                Toutes les classes de {targetLevelDisplay}
                                                </SelectItem>
                                            )}
                                            {futureClasses.length > 0 && futureClasses.map(fc => (
                                                (watchedRuleType === 'OPTION_CLASS_RESTRICTION' && (!fc.name || fc.name.trim() === '')) ? null : (
                                                    <SelectItem key={fc.id} value={fc.name}>
                                                        {fc.name}
                                                    </SelectItem>
                                                )
                                            ))}
                                            {futureClasses.length === 0 && watchedRuleType === 'OPTION_CLASS_RESTRICTION' && (
                                                <SelectItem value="no-classes-available" disabled>Aucune classe créée pour ce niveau</SelectItem>
                                            )}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                              </>
                          )}

                          {watchedRuleType === 'BALANCE_LEVEL_IN_CLASS' && (
                            <>
                              <FormField
                                control={addRuleForm.control}
                                name="levelToBalance"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Niveau à équilibrer</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || UNSPECIFIED_SELECT_VALUE}>
                                      <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Choisir un niveau..." /></SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="A">A</SelectItem>
                                        <SelectItem value="B">B</SelectItem>
                                        <SelectItem value="C">C</SelectItem>
                                        <SelectItem value="D">D</SelectItem>
                                        <SelectItem value={UNSPECIFIED_SELECT_VALUE}>Non spécifié</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={addRuleForm.control}
                                name="maxStudentsOfLevel"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nombre maximum d'élèves de ce niveau par classe</FormLabel>
                                    <FormControl>
                                      <Input type="number" min="1" placeholder="Ex: 1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}

                          {watchedRuleType === 'BALANCE_VIGILANCE_IN_CLASS' && (
                            <>
                              <FormField
                                control={addRuleForm.control}
                                name="vigilanceToBalance"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Code Vigilance à équilibrer</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || UNSPECIFIED_SELECT_VALUE}>
                                      <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Choisir un code vigilance..." /></SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="ROUGE">Rouge</SelectItem>
                                        <SelectItem value="ORANGE">Orange</SelectItem>
                                        <SelectItem value={UNSPECIFIED_SELECT_VALUE}>Non spécifié</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={addRuleForm.control}
                                name="maxStudentsOfVigilance"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nombre maximum d'élèves avec ce code par classe</FormLabel>
                                    <FormControl>
                                      <Input type="number" min="1" placeholder="Ex: 1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}

                          {watchedRuleType === 'BALANCE_PAP_IN_CLASS' && (
                            <FormField
                              control={addRuleForm.control}
                              name="maxStudentsWithPAP"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nombre maximum d'élèves avec un PAP par classe</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="1" placeholder="Ex: 1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <FormField
                            control={addRuleForm.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message de la Règle</FormLabel>
                                <FormControl>
                                  <Textarea rows={3} placeholder="Décrivez la règle ou le message d'erreur..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                              <DialogClose asChild><Button type="button" variant="outline">Annuler</Button></DialogClose>
                              <Button type="submit" form="add-rule-form">Ajouter la Règle</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  {placementRules.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Aucune règle de placement active.</p>
                  ) : (
                    placementRules.map(rule => {
                      const isPermanentRule = rule.type === 'AVOID_NPMA_PAIRING' || rule.type === 'ASSIGN_TOGETHER_AMA';
                      return (
                        <div key={rule.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                          <div>
                            <p className="font-medium text-sm">{getRuleDescription(rule)}</p>
                            <p className="text-xs text-muted-foreground">{rule.message}</p>
                          </div>
                          {isPermanentRule ? (
                            <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span tabIndex={0}>
                                            <Button variant="ghost" size="icon" disabled className="cursor-not-allowed">
                                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                        <p>Cette règle globale ne peut pas être supprimée.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setRuleToDeleteId(rule.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                               {ruleToDeleteId === rule.id && (
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer cette règle ? Cette action ne peut pas être annulée.
                                      <br/>
                                      <i>{getRuleDescription(rule)}</i>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setRuleToDeleteId(null)}>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteRule}>Supprimer</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                               )}
                            </AlertDialog>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <DialogFooter className="border-t pt-4">
                  <DialogClose asChild><Button type="button" variant="outline">Fermer</Button></DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

             <AlertDialog open={isResetConfirmationDialogOpen} onOpenChange={setResetConfirmationDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-4 sm:w-4"/>
                  Réinitialiser
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la réinitialisation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir réinitialiser tous les placements pour le niveau {targetLevelDisplay} ?
                    Les élèves actuellement affectés à une future classe pour ce niveau seront remis dans la section "Non positionnés".
                    Cette action ne peut pas être annulée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetPlacements}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleExportCsv} variant="outline" size="sm" disabled={!allStudents.length || !csvHeaders.length}>
                <Download className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-4 sm:w-4"/>
                Exporter
            </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-6">
        {/* Future Classes Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Futures classes de {targetLevelDisplay}</h2>
          {futureClasses.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-1">
                {futureClasses.map((fc) => (
                    <FutureClassCard
                      key={fc.id}
                      classShell={fc}
                      allStudents={allStudents}
                      activeId={activeId}
                      currentOverDroppableId={currentOverDroppableId}
                      searchTerm={searchTerm}
                      classViolations={classViolations}
                      detailedStats={classDetailedStats[fc.id]}
                      onEditStudent={handleOpenEditDialog}
                      onViewDetails={handleOpenStudentDetailsDialog}
                      onReorderStudents={handleReorderStudentsInClass}
                    />
                ))}
              </div>
          ) : (
              <div className="text-muted-foreground italic text-center py-4">
                  <p>Aucune future classe créée. Utilisez la barre de configuration pour en ajouter.</p>
                  <p className="mt-1">Sélectionnez le nombre de classe par barrette et cliquez sur créer/maj.</p>
              </div>
          )}
        </div>

        {/* Unassigned Students Section */}
        <Card
          ref={setUnassignedDroppableRef}
          className={cn(
            "w-full shadow-md",
            (activeId && currentOverDroppableId === UNASSIGNED_CONTAINER_ID) ? "bg-blue-200" : ""
            )}
        >
          <CardHeader className="bg-muted/30 p-3"> {/* Adjusted padding */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 w-full">
              <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 text-primary" />
                  Élèves non positionnés ({studentsToPlace.length})
              </CardTitle>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                  <p className="text-sm text-muted-foreground order-first sm:order-none">
                      Source: {sourceLevel} {searchTerm && `(Recherche: "${searchTerm}")`}
                  </p>
                  <div className="flex items-center space-x-2">
                      <Dialog open={isAddRepeaterDialogOpen} onOpenChange={(isOpen) => {
                          setAddRepeaterDialogOpen(isOpen);
                          if (!isOpen) {
                              setRepeaterSearchTerm("");
                              setSelectedRepeaterKey(null);
                          }
                      }}>
                          <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                  <Repeat className="mr-2 h-4 w-4" />
                                  Ajouter un redoublant
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                  <DialogTitle>Ajouter un redoublant pour le niveau {targetLevelDisplay}</DialogTitle>
                                  <DialogDescription>
                                      Recherchez et sélectionnez un élève à ajouter comme redoublant.
                                      L'élève sera configuré pour apparaître dans la liste "Élèves non positionnés".
                                  </DialogDescription>
                              </DialogHeader>
                              <div className="py-4 space-y-3">
                                  <Input
                                      placeholder="Rechercher par nom, prénom, classe actuelle..."
                                      value={repeaterSearchTerm}
                                      onChange={(e) => setRepeaterSearchTerm(e.target.value)}
                                  />
                                  <ScrollArea className="h-[300px] border rounded-md">
                                      {filteredPotentialRepeaters.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">Aucun élève trouvé ou tous les élèves sont déjà dans le vivier de placement.</p>}
                                      <div className="p-2 space-y-1">
                                          {filteredPotentialRepeaters.map(student => {
                                              const studentKey = getStudentKey(student);
                                              return (
                                                  <Button
                                                      key={studentKey}
                                                      variant={selectedRepeaterKey === studentKey ? "secondary" : "outline"}
                                                      className="w-full justify-start text-left h-auto py-2"
                                                      onClick={() => setSelectedRepeaterKey(studentKey)}
                                                  >
                                                      <div className="flex flex-col">
                                                          <span className="font-medium">{student.NOM} {student.PRENOM}</span>
                                                          <span className="text-xs text-muted-foreground">Classe actuelle: {student.CLASSE || "N/A"} - Né(e) le: {student.DATE || "N/A"}</span>
                                                      </div>
                                                  </Button>
                                              );
                                          })}
                                      </div>
                                  </ScrollArea>
                              </div>
                              <DialogFooter>
                                  <DialogClose asChild><Button type="button" variant="outline">Annuler</Button></DialogClose>
                                  <Button type="button" onClick={handleAddRepeater} disabled={!selectedRepeaterKey}>
                                      Ajouter comme redoublant
                                  </Button>
                              </DialogFooter>
                          </DialogContent>
                      </Dialog>

                      <Dialog open={isAddStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
                          <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Ajouter un élève
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col top-[calc(50%_+_25px)]">
                              <DialogHeader>
                                  <DialogTitle>Ajouter un nouvel élève</DialogTitle>
                                  <DialogDescription>
                                      Saisissez les informations de l'élève. NOM et Prénom sont requis.
                                  </DialogDescription>
                              </DialogHeader>
                              <div className="flex-1 overflow-y-auto py-4 pr-4">
                                  <Form {...addStudentForm}>
                                      <form id="add-student-form" onSubmit={addStudentForm.handleSubmit(handleAddStudentSubmit)} className="space-y-3">
                                          <FormField control={addStudentForm.control} name="NOM" render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="DUPONT" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                          <FormField control={addStudentForm.control} name="PRENOM" render={({ field }) => (<FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="Jean" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                          <FormField control={addStudentForm.control} name="DATE" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Date de naissance</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "dd/MM/yyyy", {locale: fr})) : (<span>Choisir une date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar locale={fr} mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) =>date > new Date() || date < new Date("1900-01-01")} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} labels={dayPickerLabels}/></PopoverContent></Popover><FormMessage /></FormItem>)} />
                                          <FormField control={addStudentForm.control} name="SEXE" render={({ field }) => (<FormItem><FormLabel>Sexe</FormLabel><Select onValueChange={field.onChange} value={field.value || UNSPECIFIED_SELECT_VALUE}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="MASCULIN">Masculin</SelectItem><SelectItem value="FÉMININ">Féminin</SelectItem><SelectItem value={UNSPECIFIED_SELECT_VALUE}>Non spécifié</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                          <FormField control={addStudentForm.control} name="NIVEAU" render={({ field }) => (<FormItem><FormLabel>Niveau (A,B,C,D)</FormLabel><Select onValueChange={field.onChange} value={field.value || UNSPECIFIED_SELECT_VALUE}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem><SelectItem value="D">D</SelectItem><SelectItem value={UNSPECIFIED_SELECT_VALUE}>Non spécifié</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                          <FormField control={addStudentForm.control} name="NPMA_NOM" render={({ field }) => (<FormItem><FormLabel>NPMA Nom</FormLabel><FormControl><Input placeholder="DUPONT" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                          <FormField control={addStudentForm.control} name="NPMA_PRENOM" render={({ field }) => (<FormItem><FormLabel>NPMA Prénom</FormLabel><FormControl><Input placeholder="Sophie" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                          <FormField control={addStudentForm.control} name="AMA_NOM" render={({ field }) => (<FormItem><FormLabel>AMA Nom</FormLabel><FormControl><Input placeholder="MARTIN" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                          <FormField control={addStudentForm.control} name="AMA_PRENOM" render={({ field }) => (<FormItem><FormLabel>AMA Prénom</FormLabel><FormControl><Input placeholder="Paul" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                          <FormField control={addStudentForm.control} name="OPTION2" render={({ field }) => (<FormItem><FormLabel>Option 2</FormLabel><FormControl><Input placeholder="Latin" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                          <FormField control={addStudentForm.control} name="OPTION3" render={({ field }) => (<FormItem><FormLabel>Option 3</FormLabel><FormControl><Input placeholder="Section Euro" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                          <FormField
                                            control={addStudentForm.control}
                                            name="PAP"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>PAP</FormLabel>
                                                <Select
                                                  onValueChange={field.onChange}
                                                  value={(field.value && field.value.trim() !== "") ? "PAP" : PAP_VALUE_NONE}
                                                >
                                                  <FormControl>
                                                    <SelectTrigger>
                                                      <SelectValue placeholder="Sélectionner..." />
                                                    </SelectTrigger>
                                                  </FormControl>
                                                  <SelectContent>
                                                    <SelectItem value="PAP">PAP</SelectItem>
                                                    <SelectItem value={PAP_VALUE_NONE}>Rien</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <FormField control={addStudentForm.control} name="COMMENTAIRES" render={({ field }) => (<FormItem><FormLabel>Commentaires</FormLabel><FormControl><Textarea rows={3} placeholder="Informations complémentaires..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                                      </form>
                                  </Form>
                              </div>
                              <DialogFooter className="shrink-0 pt-4 border-t">
                                  <DialogClose asChild><Button type="button" variant="outline">Annuler</Button></DialogClose>
                                  <Button type="submit" form="add-student-form">Ajouter l'élève</Button>
                              </DialogFooter>
                          </DialogContent>
                      </Dialog>
                  </div>
              </div>
            </div>

            {/* Quick Filters moved here */}
            <div className="mt-3 border-t border-border pt-3">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div className="flex flex-grow items-center gap-x-4 gap-y-2 flex-wrap">
                        <span className="text-sm font-medium text-muted-foreground shrink-0">Filtres rapides:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold shrink-0">Niveau:</span>
                            {['A', 'B', 'C', 'D', 'N/S'].map(level => (
                            <Button
                                key={`niveau-${level}`}
                                variant={activeFilters.niveau === level ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleFilterChange('niveau', level)}
                                className="h-7 px-2 text-xs"
                            >
                                {level}
                            </Button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold shrink-0">PAP:</span>
                            {['avec', 'sans'].map(papState => (
                            <Button
                                key={`pap-${papState}`}
                                variant={activeFilters.pap === papState ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleFilterChange('pap', papState as 'avec' | 'sans')}
                                className="h-7 px-2 text-xs capitalize"
                            >
                                {papState}
                            </Button>
                            ))}
                        </div>
                         <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold shrink-0">Vigilance:</span>
                            {['ROUGE', 'ORANGE'].map(vigilanceState => (
                            <Button
                                key={`vigilance-${vigilanceState}`}
                                variant={activeFilters.vigilance === vigilanceState ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleFilterChange('vigilance', vigilanceState as 'ROUGE' | 'ORANGE')}
                                className="h-7 px-2 text-xs capitalize"
                            >
                                {vigilanceState.charAt(0) + vigilanceState.slice(1).toLowerCase()}
                            </Button>
                            ))}
                        </div>
                        {relevantOptionsForFilters.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold shrink-0">Options:</span>
                                {relevantOptionsForFilters.map(optionConfig => (
                                    <Button
                                    key={`option-${optionConfig.id}`}
                                    variant={activeFilters.options.includes(optionConfig.id) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleOptionFilterChange(optionConfig.id)}
                                    className="h-7 px-2 text-xs"
                                    >
                                    {optionConfig.badgeText}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                    {(activeFilters.niveau || activeFilters.pap || activeFilters.options.length > 0 || activeFilters.vigilance) && (
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0">
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Réinitialiser
                        </Button>
                    )}
                </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 min-h-[150px]">
            <SortableContext items={unassignedStudentKeys} strategy={rectSortingStrategy} id={UNASSIGNED_CONTAINER_ID}>
                {studentsToPlace.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-1">
                    {studentsToPlace.map((student) => (
                        <SortableStudentCard
                            student={student}
                            key={getStudentKey(student)}
                            searchTerm={searchTerm}
                            onEditStudent={handleOpenEditDialog}
                            onViewDetails={handleOpenStudentDetailsDialog}
                            showConstraintIcons={true}
                            allStudentsForConstraints={allStudents}
                        />
                    ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground italic text-center py-4">
                    {searchTerm ? `Aucun élève ne correspond à "${searchTerm}" pour le niveau source "${sourceLevel}".` : (allStudents.length > 0 ? `Aucun élève à placer du niveau "${sourceLevel}" ou tous les élèves ont déjà une future classe.` : "Chargez un fichier CSV.")}
                    </p>
                )}
            </SortableContext>
            </CardContent>
        </Card>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={isEditStudentDialogOpen} onOpenChange={setEditStudentDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col top-[calc(50%_+_25px)]">
          <DialogHeader>
            <DialogTitle>Modifier l'élève</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de l'élève.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 pr-4">
            <Form {...editStudentForm}>
              <form id="edit-student-form" onSubmit={editStudentForm.handleSubmit(handleEditStudentSubmit)} className="space-y-3">
                <FormField control={editStudentForm.control} name="NOM" render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="DUPONT" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editStudentForm.control} name="PRENOM" render={({ field }) => (<FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="Jean" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editStudentForm.control} name="DATE" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Date de naissance</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "dd/MM/yyyy", {locale: fr})) : (<span>Choisir une date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar locale={fr} mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) =>date > new Date() || date < new Date("1900-01-01")} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} labels={dayPickerLabels}/></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <FormField control={editStudentForm.control} name="SEXE" render={({ field }) => (<FormItem><FormLabel>Sexe</FormLabel><Select onValueChange={field.onChange} value={field.value || UNSPECIFIED_SELECT_VALUE}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="MASCULIN">Masculin</SelectItem><SelectItem value="FÉMININ">Féminin</SelectItem><SelectItem value={UNSPECIFIED_SELECT_VALUE}>Non spécifié</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={editStudentForm.control} name="NIVEAU" render={({ field }) => (<FormItem><FormLabel>Niveau (A,B,C,D)</FormLabel><Select onValueChange={field.onChange} value={field.value || UNSPECIFIED_SELECT_VALUE}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem><SelectItem value="D">D</SelectItem><SelectItem value={UNSPECIFIED_SELECT_VALUE}>Non spécifié</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField
                  control={editStudentForm.control}
                  name="CODE_VIGILANCE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code Vigilance</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || UNSPECIFIED_SELECT_VALUE}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ROUGE">Rouge</SelectItem>
                          <SelectItem value="ORANGE">Orange</SelectItem>
                          <SelectItem value={UNSPECIFIED_SELECT_VALUE}>Non spécifié</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editStudentForm.control}
                  name="PAP"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAP</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={(field.value && field.value.trim() !== "") ? "PAP" : PAP_VALUE_NONE}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PAP">PAP</SelectItem>
                          <SelectItem value={PAP_VALUE_NONE}>Rien</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={editStudentForm.control} name="OPTION1" render={({ field }) => (<FormItem><FormLabel>Option 1</FormLabel><FormControl><Input placeholder="Anglais LV1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editStudentForm.control} name="OPTION2" render={({ field }) => (<FormItem><FormLabel>Option 2</FormLabel><FormControl><Input placeholder="Latin" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editStudentForm.control} name="OPTION3" render={({ field }) => (<FormItem><FormLabel>Option 3</FormLabel><FormControl><Input placeholder="Section Euro" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editStudentForm.control} name="NPMA_NOM" render={({ field }) => (<FormItem><FormLabel>NPMA Nom</FormLabel><FormControl><Input placeholder="DURAND" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editStudentForm.control} name="NPMA_PRENOM" render={({ field }) => (<FormItem><FormLabel>NPMA Prénom</FormLabel><FormControl><Input placeholder="Sophie" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editStudentForm.control} name="AMA_NOM" render={({ field }) => (<FormItem><FormLabel>AMA Nom</FormLabel><FormControl><Input placeholder="MARTIN" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editStudentForm.control} name="AMA_PRENOM" render={({ field }) => (<FormItem><FormLabel>AMA Prénom</FormLabel><FormControl><Input placeholder="Paul" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editStudentForm.control} name="COMMENTAIRES" render={({ field }) => (<FormItem><FormLabel>Commentaires</FormLabel><FormControl><Textarea rows={3} placeholder="Informations complémentaires, observations..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              </form>
            </Form>
          </div>
          <DialogFooter className="shrink-0 pt-4 border-t">
            <DialogClose asChild><Button type="button" variant="outline" onClick={() => {setEditStudentDialogOpen(false); setEditingStudentKey(null);}}>Annuler</Button></DialogClose>
            <Button type="submit" form="edit-student-form">Enregistrer les modifications</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Details Dialog */}
      <Dialog open={isStudentDetailsDialogOpen} onOpenChange={setStudentDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Détails de l'élève : {studentBeingViewed?.NOM} {studentBeingViewed?.PRENOM}
            </DialogTitle>
          </DialogHeader>
          {studentBeingViewed && (
            <div className="space-y-2 py-4 text-sm">
              <p><span className="font-medium">Classe d'origine :</span> {studentBeingViewed.CLASSE}</p>
              <p><span className="font-medium">Né(e) le :</span> {studentBeingViewed.DATE}</p>
              <p><span className="font-medium">Sexe :</span> {studentBeingViewed.SEXE}</p>
              {studentBeingViewed.NIVEAU && <p><span className="font-medium">Niveau :</span> {studentBeingViewed.NIVEAU.toUpperCase()}</p>}
              {(studentBeingViewed.NPMA_NOM || studentBeingViewed.NPMA_PRENOM) && <p><span className="font-medium">Ne pas mettre avec :</span> {studentBeingViewed.NPMA_NOM} {studentBeingViewed.NPMA_PRENOM}</p>}
              {studentBeingViewed.OPTION1 && <p><span className="font-medium">Option 1 :</span> {studentBeingViewed.OPTION1}</p>}
              {studentBeingViewed.OPTION2 && <p><span className="font-medium">Option 2 :</span> {studentBeingViewed.OPTION2}</p>}
              {studentBeingViewed.OPTION3 && <p><span className="font-medium">Option 3 :</span> {studentBeingViewed.OPTION3}</p>}
              {(studentBeingViewed.AMA_NOM || studentBeingViewed.AMA_PRENOM) && (
                <p><span className="font-medium">Assigner avec :</span> {studentBeingViewed.AMA_NOM} {studentBeingViewed.AMA_PRENOM}</p>
              )}
              {studentBeingViewed.CODE_VIGILANCE && (
                <p>
                  <span className="font-medium">Code Vigilance :</span>{' '}
                  <span
                    className={cn({
                      'text-red-600 font-semibold': studentBeingViewed.CODE_VIGILANCE.toUpperCase() === 'ROUGE',
                      'text-orange-500 font-semibold': studentBeingViewed.CODE_VIGILANCE.toUpperCase() === 'ORANGE',
                    })}
                  >
                    {studentBeingViewed.CODE_VIGILANCE}
                  </span>
                </p>
              )}
              {studentBeingViewed.PAP && studentBeingViewed.PAP.trim() !== "" && <p><span className="font-medium">PAP :</span> {studentBeingViewed.PAP}</p>}
              {studentBeingViewed.COMMENTAIRES && studentBeingViewed.COMMENTAIRES.trim() !== "" && <p><span className="font-medium">Commentaires :</span> <span className="whitespace-pre-wrap">{studentBeingViewed.COMMENTAIRES}</span></p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentDetailsDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Rapport de Placement pour {targetLevelDisplay}</DialogTitle>
            <DialogDescription>
              Scores et détails des classes actuellement configurées. Un score plus élevé indique une meilleure adéquation théorique.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3 py-2">
              {reportData.length === 0 && <p className="text-muted-foreground text-center">Aucune donnée de rapport à afficher. Assurez-vous que des élèves sont placés.</p>}
              {reportData.map((classInfo) => (
                <div 
                  key={classInfo.classId} 
                  className={cn(
                    "py-3 px-2 border-b", 
                    classInfo.violatedRuleMessages.length > 0 ? "border-l-4 border-l-destructive bg-destructive/5 pl-3" : "pl-2"
                  )}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h4 className="text-md font-semibold text-primary">{classInfo.className}</h4>
                    <Badge variant={classInfo.violatedRuleMessages.length > 0 ? "destructive" : "secondary"} className="text-xs">
                      Score: {classInfo.score}
                    </Badge>
                  </div>
                  <div className="text-xs space-y-0.5 text-muted-foreground">
                    <p><strong>Effectif :</strong> {classInfo.studentCount} (G: {classInfo.boysCount}, F: {classInfo.girlsCount}, N/S: {classInfo.unspecifiedSexCount})</p>
                    <p>
                      <strong>Niveaux :</strong>
                      A: <span className="font-medium text-green-700">{classInfo.niveaux.A}</span>,{' '}
                      B: <span className="font-medium text-green-500">{classInfo.niveaux.B}</span>,{' '}
                      C: <span className="font-medium text-yellow-500">{classInfo.niveaux.C}</span>,{' '}
                      D: <span className="font-medium text-red-500">{classInfo.niveaux.D}</span>,{' '}
                      Non Spéc.: <span className="font-medium">{classInfo.niveaux.unspecified}</span>
                    </p>
                    <p>
                      <strong>Vigilance :</strong>
                      Rouge: <span className="font-medium text-red-600">{classInfo.vigilance.ROUGE}</span>,{' '}
                      Orange: <span className="font-medium text-orange-500">{classInfo.vigilance.ORANGE}</span>,{' '}
                      Non Spéc.: <span className="font-medium">{classInfo.vigilance.unspecified}</span>
                    </p>
                    <p><strong>PAP :</strong> <span className="font-medium text-yellow-600">{classInfo.papCount}</span></p>
                  </div>
                    {classInfo.violatedRuleMessages.length > 0 && (
                      <div className="mt-2 pt-1 border-t border-destructive/20">
                        <strong className="text-destructive text-xs">Violations ({classInfo.violatedRuleMessages.length}) :</strong>
                        <ul className="list-disc list-inside text-destructive/90 pl-4 text-xs mt-0.5 space-y-px">
                          {classInfo.violatedRuleMessages.map((msg, idx) => <li key={idx}>{msg}</li>)}
                        </ul>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <DragOverlay>
        {activeStudent ?
            <StudentCardDnd
                student={activeStudent}
                searchTerm={searchTerm}
                isOverlay
                onEditStudent={handleOpenEditDialog}
                onViewDetails={handleOpenStudentDetailsDialog}
                showConstraintIcons={true}
                allStudentsForConstraints={allStudents}
            />
        : null}
      </DragOverlay>
    </main>
    </DndContext>
  );
}

