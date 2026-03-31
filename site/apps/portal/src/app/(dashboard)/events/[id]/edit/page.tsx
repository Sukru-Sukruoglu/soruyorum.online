import { QuizEditorV2 } from '@/components/events/QuizEditorV2';

export default function EventEditorPage({ params }: { params: { id: string } }) {
    return <QuizEditorV2 eventId={params.id} />;
}
