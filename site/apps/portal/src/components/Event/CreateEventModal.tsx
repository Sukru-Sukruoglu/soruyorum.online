import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent, startEvent, updateEvent, Event } from '@/services/api';
import { fetchPortalAuthSession, logoutPortalSession } from '@/utils/authSession';
import PinDisplay from './PinDisplay';
import QRCodeDisplay from './QRCodeDisplay';
import EventSettingsForm, { EventFormData } from './EventSettingsForm';
import '@/styles/event-type-selector.css';
import { X, Copy, Rocket } from 'lucide-react';
import { ENABLED_EVENT_TYPES, ENABLED_TEMPLATE_SELECTION_DEFS } from '@/lib/eventTypes';

interface CreateEventModalProps {
    onClose: () => void;
    onEventCreated?: (event: Event) => void;
    initialStep?: 'template' | 'settings' | 'details';
    initialTemplate?: 'tombala' | 'quiz' | 'poll' | 'wheel' | 'ranking' | 'wordcloud' | 'matching';
    displayTitle?: string;
    eventToEdit?: Event | null;
    afterCreate?: 'success' | 'edit';
}

export default function CreateEventModal({
    onClose,
    onEventCreated,
    initialStep = 'template',
    initialTemplate = 'tombala',
    displayTitle,
    eventToEdit,
    afterCreate = 'success'
}: CreateEventModalProps) {
    const rawEventType = ((eventToEdit as any)?.eventType ?? (eventToEdit as any)?.event_type) as
        | 'tombala'
        | 'quiz'
        | 'poll'
        | 'wheel'
        | 'ranking'
        | 'wordcloud'
        | 'matching'
        | undefined;

    const existingSettings = (() => {
        const raw = (eventToEdit as any)?.settings;
        if (!raw) return {};
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                return parsed && typeof parsed === 'object' ? parsed : {};
            } catch {
                return {};
            }
        }
        return raw && typeof raw === 'object' ? raw : {};
    })() as any;

    const [step, setStep] = useState<'template' | 'settings' | 'details' | 'success'>(() => {
        // If editing, go to settings
        if (eventToEdit) return 'settings';
        // If only one event type enabled, skip template selection
        if (ENABLED_EVENT_TYPES.length === 1) return 'settings';
        return initialStep;
    });

    const defaultTemplate = (() => {
        if (ENABLED_EVENT_TYPES.includes('quiz')) return 'quiz';
        return (ENABLED_EVENT_TYPES[0] || 'quiz') as any;
    })() as 'tombala' | 'quiz' | 'poll' | 'wheel' | 'ranking' | 'wordcloud' | 'matching';

    const [selectedTemplate, setSelectedTemplate] = useState<'tombala' | 'quiz' | 'poll' | 'wheel' | 'ranking' | 'wordcloud' | 'matching'>(
        ((eventToEdit?.eventType || (eventToEdit as any)?.event_type) as any) || initialTemplate || defaultTemplate
    );
    const [loading, setLoading] = useState(false);
    const [event, setEvent] = useState<Event | null>(eventToEdit || null);
    const [matchingStartLevel, setMatchingStartLevel] = useState<number>(1);
    const [fetchedSettings, setFetchedSettings] = useState<any>(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(!!eventToEdit && rawEventType === 'wheel');

    const router = useRouter();

    // Fetch Wheel Data on Edit
    React.useEffect(() => {
        if (eventToEdit && rawEventType === 'wheel') {
            setIsLoadingSettings(true);
            const loadWheelData = async () => {
                try {
                    const { getWheelData } = await import('@/app/actions/wheel');
                    const wheelData = await getWheelData(eventToEdit.id);
                    if (wheelData?.settings) {
                        setFetchedSettings(wheelData.settings);
                    }
                } catch (error) {
                    console.error("Error loading wheel settings:", error);
                } finally {
                    setIsLoadingSettings(false);
                }
            };
            loadWheelData();
        }
    }, [eventToEdit, rawEventType]);

    const handleTemplateSelect = (template: 'tombala' | 'quiz' | 'poll' | 'wheel' | 'ranking' | 'wordcloud' | 'matching') => {
        setSelectedTemplate(template);
        setStep('settings');
    };

    // If the currently selected template isn't enabled (e.g., soruyorum quiz-only), coerce it.
    React.useEffect(() => {
        if (!ENABLED_EVENT_TYPES.includes(selectedTemplate as any)) {
            setSelectedTemplate(defaultTemplate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSaveSettings = async (formData: EventFormData) => {
        if (selectedTemplate === 'matching') {
            const activeLevelId = formData.settings.matching?.levels?.find((l) => l.active)?.id;
            setMatchingStartLevel(typeof activeLevelId === 'number' ? activeLevelId : 1);
        }

        const session = await fetchPortalAuthSession().catch(() => null);
        if (!session?.authenticated) {
            alert('Lütfen önce giriş yapınız.');
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            if (eventToEdit) {
                const updatedEvent = await updateEvent(eventToEdit.id, formData);
                setEvent(updatedEvent);

                // Update Wheel Data if applicable
                if (selectedTemplate === 'wheel' && formData.settings.wheel) {
                    const { saveWheelData } = await import('@/app/actions/wheel');
                    await saveWheelData(eventToEdit.id, {
                        settings: {
                            // Base with existing settings to preserve other fields
                            ...fetchedSettings,
                            // Override with new values from form
                            enableAccessCodes: formData.settings.wheel.enableAccessCodes,
                            requireIdentityNumber: formData.settings.wheel.requireIdentityNumber,
                            requireName: formData.settings.registration.requireName,
                            requirePhone: formData.settings.registration.requirePhone,
                            requireEmail: formData.settings.registration.requireEmail,
                            wheelSize: formData.settings.wheel.wheelSize || fetchedSettings?.wheelSize || 600,
                            spinDuration: formData.settings.wheel.spinDuration || fetchedSettings?.spinDuration || 5000,
                        },
                        prizes: [] // Don't overwrite prizes here
                    });
                    // Generate Codes if requested (Update scenario)
                    if (formData.settings.wheel.enableAccessCodes && (formData.settings.wheel.codeCount || 0) > 0) {
                        const { generateAccessCodes } = await import('@/app/actions/wheel');
                        await generateAccessCodes(eventToEdit.id, formData.settings.wheel.codeCount || 50);
                    }
                }

                onEventCreated?.(updatedEvent); // Notify parent to refresh list
                onClose(); // Close modal immediately after update
                alert('Etkinlik güncellendi! ✅');
            } else {
                const createdEvent = await createEvent(formData);
                setEvent(createdEvent);

                // If Wheel event, save custom security settings immediately
                if (selectedTemplate === 'wheel' && formData.settings.wheel) {
                    // Dynamic import to avoid server action issues in client component if strict
                    const { saveWheelData } = await import('@/app/actions/wheel');
                    await saveWheelData(createdEvent.id, {
                        settings: {
                            enableAccessCodes: formData.settings.wheel.enableAccessCodes,
                            requireIdentityNumber: formData.settings.wheel.requireIdentityNumber,
                            requireName: formData.settings.registration.requireName,
                            requirePhone: formData.settings.registration.requirePhone,
                            requireEmail: formData.settings.registration.requireEmail
                        },
                        prizes: [] // Keep default prizes seeded by action
                    });

                    // Generate Codes if requested
                    if (formData.settings.wheel.enableAccessCodes && (formData.settings.wheel.codeCount || 0) > 0) {
                        const { generateAccessCodes } = await import('@/app/actions/wheel');
                        await generateAccessCodes(createdEvent.id, formData.settings.wheel.codeCount || 50);
                    }
                }

                // Show Success Modal instead of redirecting immediately
                onEventCreated?.(createdEvent);
                if (afterCreate === 'edit') {
                    router.push(`/events/${createdEvent.id}/edit`);
                    onClose();
                    return;
                }

                setStep('success');
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                alert("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
                void logoutPortalSession().finally(() => {
                    window.location.href = '/login';
                });
                return;
            }
            alert(error.response?.data?.error || 'Etkinlik oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    // ... (keep handleStartEvent)

    // STEP 4: Success / Completion
    if (step === 'success' && event) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                <div className="w-full max-w-4xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-green-500/30">
                            🎉 Etkinlik oluşturuldu
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Etkinliğin hazır. Şimdi ne yapmak istersin?</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {/* Option 1: Go to List */}
                        <div
                            onClick={() => router.push('/events')}
                            className="bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 rounded-2xl p-8 text-center cursor-pointer transition-all hover:scale-105 group"
                        >
                            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-500/30 transition-colors">
                                <span className="text-4xl">📋</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Etkinliklerim</h3>
                            <p className="text-gray-400">Tüm etkinliklerine göz atmak için geri dön</p>
                        </div>

                        {/* Option 2: Go to Editor/Start */}
                        <div
                            onClick={() => {
                                if (event.eventType === 'wheel') {
                                    router.push(`/events/new/wheeloffortune?id=${event.id}`)
                                } else if (event.eventType === 'ranking') {
                                    router.push(`/events/new/ranking?id=${event.id}`)
                                } else if (event.eventType === 'wordcloud') {
                                    router.push(`/events/new/wordcloud?id=${event.id}`)
                                } else if (event.eventType === 'matching') {
                                    window.location.href = `https://soruyorum.online/esiniBul/game_v2.html?event_id=${event.id}&seviye=${matchingStartLevel}`;
                                } else {
                                    router.push(`/events/${event.id}/edit`)
                                }
                            }}
                            className="bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 border border-indigo-500/30 rounded-2xl p-8 text-center cursor-pointer transition-all hover:scale-105 shadow-xl shadow-indigo-900/50 group"
                        >
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-white/30 transition-colors">
                                <Rocket className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Başlat</h3>
                            <p className="text-indigo-200">{event.name} etkinliğini başlatmak için devam et</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    const handleStartEvent = async () => {
        if (!event) return;
        setLoading(true);

        try {
            const startedEvent = await startEvent(event.id);
            setEvent(startedEvent);
            alert('Etkinlik başlatıldı! 🎉');
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Etkinlik başlatılamadı');
        } finally {
            setLoading(false);
        }
    };

    // STEP 1: Template Selection
    if (step === 'template') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
                <div className="light-panel bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800">Etkinlik Türü Seçin</h2>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="event-type-grid">
                            {ENABLED_TEMPLATE_SELECTION_DEFS.map((d) => (
                                <button
                                    key={d.template}
                                    className="event-type-card"
                                    onClick={() => handleTemplateSelect(d.template)}
                                >
                                    <div className="card-icon">{d.emoji}</div>
                                    <h3>{d.title}</h3>
                                    <p>{d.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // STEP 2: Settings Form
    if (step === 'settings') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="light-panel bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 relative animate-in zoom-in-95 duration-200">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-gray-100 rounded-full text-gray-600 transition-colors z-10"
                        title="Kapat"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Wrapper to ensure internal scrolling if needed or just container */}
                    <div className="max-h-[90vh] overflow-y-auto rounded-xl">
                        {isLoadingSettings ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                                <p className="text-gray-500">Ayarlar yükleniyor...</p>
                            </div>
                        ) : (
                            <EventSettingsForm
                                initialTemplate={selectedTemplate}
                                displayTitle={displayTitle}
                                onSave={handleSaveSettings}
                                onCancel={onClose}
                                initialData={eventToEdit ? {
                                    id: (eventToEdit as any).id,
                                    title: eventToEdit.name || eventToEdit.title || '',
                                    eventType: (eventToEdit.eventType || (eventToEdit as any).event_type) as any,
                                    description: (eventToEdit as any).description || '',
                                    maxParticipants:
                                        (eventToEdit as any).maxParticipants !== undefined
                                            ? (eventToEdit as any).maxParticipants
                                            : (eventToEdit as any).max_participants !== undefined
                                                ? (eventToEdit as any).max_participants
                                                : 100,
                                    eventPin: (eventToEdit as any).eventPin ?? (eventToEdit as any).event_pin ?? (eventToEdit as any).pin,
                                    joinUrl: (eventToEdit as any).joinUrl ?? (eventToEdit as any).join_url,
                                    qrCodeUrl: (eventToEdit as any).qrCodeUrl ?? (eventToEdit as any).qr_code_url,
                                    settings: {
                                        registration: {
                                            // Wheel uses separate settings store; others come from event.settings if present
                                            requirePin: existingSettings?.registration?.requirePin ?? true,
                                            requireName: rawEventType === 'wheel' ? (fetchedSettings?.requireName ?? true) : (existingSettings?.registration?.requireName ?? true),
                                            requireEmail: rawEventType === 'wheel' ? (fetchedSettings?.requireEmail ?? false) : (existingSettings?.registration?.requireEmail ?? false),
                                            requirePhone: rawEventType === 'wheel' ? (fetchedSettings?.requirePhone ?? false) : (existingSettings?.registration?.requirePhone ?? false),
                                            requireAvatar: existingSettings?.registration?.requireAvatar ?? false,
                                            requireId: existingSettings?.registration?.requireId ?? false,
                                            allowAnonymous: existingSettings?.registration?.allowAnonymous ?? false,
                                            requireKvkkConsent: existingSettings?.registration?.requireKvkkConsent ?? true,
                                        },
                                        wheel: {
                                            enableAccessCodes: fetchedSettings?.enableAccessCodes ?? false,
                                            requireIdentityNumber: fetchedSettings?.requireIdentityNumber ?? false,
                                            codeCount: fetchedSettings?.codeCount, // If we store this?
                                        },
                                        gameplay: {
                                            autoMarkNumbers: existingSettings?.gameplay?.autoMarkNumbers ?? false,
                                            autoStartEvent: existingSettings?.gameplay?.autoStartEvent ?? false,
                                            showHostInfo: existingSettings?.gameplay?.showHostInfo ?? false,
                                            canHostReset: existingSettings?.gameplay?.canHostReset ?? false,
                                            stepManager: (existingSettings?.gameplay as any)?.stepManager,
                                            startDateTime: existingSettings?.gameplay?.startDateTime,
                                        },
                                        matching: existingSettings?.matching,
                                    }
                                } : undefined}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // STEP 3: Details (PIN/QR)
    if (step === 'details' && event) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                <div className="light-panel bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                        <h2 className="text-xl font-semibold text-gray-800 truncate pr-4">{event.title}</h2>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <PinDisplay
                                    eventId={event.id}
                                    initialPin={event.eventPin}
                                    initialJoinUrl={event.joinUrl}
                                    initialQrCodeUrl={event.qrCodeUrl}
                                />

                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Katılım Linki</h4>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={event.joinUrl}
                                            readOnly
                                            className="flex-1 text-xs font-mono bg-white border border-gray-300 rounded px-2 py-1 text-gray-600"
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(event.joinUrl);
                                                alert('Link kopyalandı! 📋');
                                            }}
                                            className="p-1 hover:bg-gray-200 rounded text-gray-600"
                                            title="Kopyala"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <QRCodeDisplay qrCodeUrl={event.qrCodeUrl} />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${event.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            <span className="text-sm font-medium text-gray-600 capitalize">{event.status === 'draft' ? 'Proje' : 'Aktif'}</span>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                                Kapat
                            </button>
                            <button
                                onClick={handleStartEvent}
                                disabled={loading || event.status === 'active'}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-green-600/20"
                            >
                                <Rocket className="w-4 h-4 mr-2" />
                                {loading ? 'Başlatılıyor...' : event.status === 'active' ? 'Yayınlandı' : 'Yayını Başlat'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
