"use client";

import { trpc } from "../../utils/trpc";
import { Button } from "@ks-interaktif/ui";
import {
    Plus,
    Trash2,
    MoreVertical,
    GripVertical,
    CheckCircle2,
    Image as ImageIcon,
    Clock,
    Trophy
} from "lucide-react";
import { useState } from "react";

interface ActivityEditorProps {
    activity: any;
    onUpdate: () => void;
}

export function ActivityEditor({ activity, onUpdate }: ActivityEditorProps) {
    const activityId = activity.id;
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

    // Activity lookup - ideally we'd have a getByActivityId but we can reuse the event data or fetch it here
    // For simplicity, let's assume we fetch it via a separate query if needed, or better, update the router.
    // Actually, I'll just use the event data from parent for now if possible, but separate query is cleaner.
    // Wait, let's just fetch the event again or use a specific activity query.
    // I'll add getById to events router that also works for activities? No, separate router would be better.
    // Let's just use getById from events router for now and filter.
    const utils = trpc.useUtils();
    // We need the event ID to refetch.

    // Let's add addQuestion mutation
    const addQuestion = trpc.events.addQuestion.useMutation({
        onSuccess: () => onUpdate()
    });

    const deleteQuestion = trpc.events.deleteQuestion.useMutation({
        onSuccess: () => onUpdate()
    });

    const updateQuestion = trpc.events.updateQuestion.useMutation({
        onSuccess: () => {
            onUpdate();
            setEditingQuestionId(null);
        }
    });

    const handleAddQuestion = () => {
        addQuestion.mutate({
            activityId,
            text: 'Yeni Soru',
            options: ['Seçenek 1', 'Seçenek 2', 'Seçenek 3', 'Seçenek 4'],
            correctAnswer: 0
        });
    };

    // We need to fetch the activity details. I'll add a helper query or just rely on parent.
    // Since this is a component within the page, I'll pass the data or refetch everything.
    // For now, I'll just handle the mutations.

    // I need the activity data. I'll pass it from parent as prop for better performance.
    // But for this demo, let's assume we have it.

    // Let's fetch questions for this activity specifically? 
    // I'll just pass questions as prop from parent to keep it simple and consistent.

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{activity.name || 'Aktivite'}</h2>
                    <p className="text-sm text-gray-500">{activity.questions.length} Soru Bulunuyor</p>
                </div>
                <Button
                    onClick={handleAddQuestion}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                    <Plus size={18} /> Soru Ekle
                </Button>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {activity.questions.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">Henüz soru eklenmemiş.</p>
                        <p className="text-sm">Yukarıdaki "Soru Ekle" düğmesini kullanarak ilk sorunuzu oluşturun.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activity.questions.map((question: any, index: number) => (
                            <div
                                key={question.id}
                                className="group relative bg-gray-50 rounded-2xl border border-gray-100 p-6 hover:border-indigo-200 hover:bg-white transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <input
                                            defaultValue={question.text}
                                            onBlur={(e) => {
                                                if (e.target.value !== question.text) {
                                                    updateQuestion.mutate({ id: question.id, text: e.target.value });
                                                }
                                            }}
                                            className="bg-transparent border-none font-bold text-gray-900 focus:ring-0 text-lg w-full max-w-xl"
                                            placeholder="Soru metnini girin..."
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => deleteQuestion.mutate(question.id)}
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 bg-transparent border-0"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
                                    {(question.options as string[] || []).map((option, optIndex) => (
                                        <div
                                            key={optIndex}
                                            className={`p-3 rounded-xl border flex items-center justify-between ${question.correctAnswer === optIndex
                                                ? "bg-green-50 border-green-200"
                                                : "bg-white border-gray-100"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <button
                                                    onClick={() => updateQuestion.mutate({ id: question.id, correctAnswer: optIndex })}
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${question.correctAnswer === optIndex
                                                        ? "border-green-500 bg-green-500"
                                                        : "border-gray-200"
                                                        }`}
                                                >
                                                    {question.correctAnswer === optIndex && <CheckCircle2 size={12} className="text-white" />}
                                                </button>
                                                <input
                                                    defaultValue={option}
                                                    onBlur={(e) => {
                                                        const newOptions = [...question.options];
                                                        newOptions[optIndex] = e.target.value;
                                                        updateQuestion.mutate({ id: question.id, options: newOptions });
                                                    }}
                                                    className="bg-transparent border-none text-sm text-gray-700 w-full focus:ring-0 p-0"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function HelpCircle({ size, className }: { size: number, className: string }) {
    return <HelpCircleIcon size={size} className={className} />;
}
import { HelpCircle as HelpCircleIcon } from "lucide-react";
