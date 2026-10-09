import { FC, useEffect, useState } from 'react';
import { Image, Linking, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AntDesign } from '@react-native-vector-icons/ant-design';
import { useVideoPlayer, VideoView } from 'expo-video';
import { AppStackParamList } from '@/navigator/app/AppNavigator';
import { theme } from '@/utils/theme';
import { timeAgo } from '@/utils/timeAgo';
import { yupValidate } from '@/utils/validator';
import { newInstructionSchema } from '@/validation/job';
import usePunchTasks from '@/hooks/usePunchTasks';
import { Instruction, MediaItem, PunchStatus, PunchTask } from '@/types/punchTask';
import StatusBadge, { statusColors, statusLabels } from '@/components/StatusBadge';
import { showErrorToast } from '@/components/ErrorToast';
import { showToast } from '@/components/Toast';
import AddStepForm from '@/components/AddStepForm';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';

type Props = NativeStackScreenProps<AppStackParamList, 'PunchItem'>;
type Tab = 'details' | 'notes' | 'attachments' | 'activity';

const STATUSES: PunchStatus[] = ['Open', 'In progress', 'Complete', 'Late'];

const styles = {
    card: `mb-4 rounded-2xl border p-4`,
    label: `text-xs font-bold uppercase`,
    button: `flex-row items-center justify-center rounded-lg px-4 py-3`,
    buttonText: `text-sm font-bold`,
    divider: `h-px w-full`,
};

const cardStyle = { backgroundColor: theme.colors.backgroundPrimary, borderColor: theme.colors.border };

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
const formatTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const isPastDue = (task: PunchTask) => task.status !== 'Complete' && new Date(task.dateDue).getTime() < Date.now();

const fileName = (url: string) => decodeURIComponent(url.split('/').pop() ?? 'Attachment');

const VideoPreview: FC<{ uri: string }> = ({ uri }) => {
    const player = useVideoPlayer(uri);

    return (
        <VideoView
            player={player}
            style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: theme.colors.backgroundSecondary }}
            contentFit='cover'
            nativeControls
        />
    );
};

const FileRow: FC<{ url: string; name?: string; icon?: 'paper-clip' | 'picture' | 'video-camera' }> = ({ url, name, icon = 'paper-clip' }) => (
    <TouchableOpacity className='mt-2 flex-row items-center rounded-xl border p-3' style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundTertiary }} onPress={() => Linking.openURL(url)}>
        <AntDesign name={icon} size={20} color={theme.colors.primary} />
        <Text className='ml-3 flex-1 text-sm font-semibold' style={{ color: theme.colors.textPrimary }} numberOfLines={1}>{name ?? fileName(url)}</Text>
        <Text className='text-sm font-semibold' style={{ color: theme.colors.primary }}>Open</Text>
    </TouchableOpacity>
);

const MediaView: FC<{ item: MediaItem }> = ({ item }) => (
    <View className='overflow-hidden rounded-xl'>
        {item.kind === 'video' ? (
            <VideoPreview uri={item.url} />
        ) : (
            <Image source={{ uri: item.url }} style={{ width: '100%', aspectRatio: 16 / 9 }} resizeMode='cover' />
        )}
    </View>
);

// large view of the selected photo/video with a thumbnail strip when there's more than one
const MediaGallery: FC<{ media: MediaItem[] }> = ({ media }) => {
    const [selected, setSelected] = useState(0);
    const current = media[Math.min(selected, media.length - 1)];
    if(!current) return null;

    return (
        <View>
            <MediaView key={current.url} item={current} />
            {media.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className='mt-2'>
                    {media.map((item, index) => (
                        <TouchableOpacity
                            key={`${item.id}-${index}`}
                            className='mr-2 h-14 w-14 items-center justify-center overflow-hidden rounded-lg border-2'
                            style={{ borderColor: index === selected ? theme.colors.primary : 'transparent', backgroundColor: theme.colors.backgroundTertiary }}
                            onPress={() => setSelected(index)}
                        >
                            {item.kind === 'video' ? (
                                <AntDesign name='play-circle' size={22} color={theme.colors.primary} />
                            ) : (
                                <Image source={{ uri: item.url }} className='h-full w-full' resizeMode='cover' />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const DetailLine: FC<{ icon: 'environment' | 'calendar' | 'team' | 'lock'; text: string; color?: string }> = ({ icon, text, color }) => (
    <View className='mt-2 flex-row items-center'>
        <AntDesign name={icon} size={16} color={theme.colors.iconMuted} />
        <Text className='ml-2.5 flex-1 text-sm' style={{ color: color ?? theme.colors.textPrimary }} numberOfLines={1}>{text}</Text>
    </View>
);

const TabBar: FC<{ active: Tab; notes: number; attachments: number; onChange: (tab: Tab) => void }> = ({ active, notes, attachments, onChange }) => {
    const tabs: { key: Tab; label: string }[] = [
        { key: 'details', label: 'Work Details' },
        { key: 'notes', label: `Notes (${notes})` },
        { key: 'attachments', label: `Attachments (${attachments})` },
        { key: 'activity', label: 'Activity' },
    ];

    return (
        <View className='border-b' style={{ borderColor: theme.colors.border }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {tabs.map((tab) => (
                    <TouchableOpacity key={tab.key} className='mr-5 pb-3 pt-1' onPress={() => onChange(tab.key)}>
                        <Text className='text-sm font-extrabold uppercase tracking-wide' style={{ color: active === tab.key ? theme.colors.textPrimary : theme.colors.textMuted }}>{tab.label}</Text>
                        {active === tab.key && <View className='absolute bottom-0 left-0 right-0 h-1 rounded-full' style={{ backgroundColor: theme.colors.primary }} />}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const StatusSelect: FC<{ status: PunchStatus; saving: boolean; onChange: (status: PunchStatus) => void }> = ({ status, saving, onChange }) => {
    const [open, setOpen] = useState(false);

    return (
        <View className='mt-4'>
            <View className='flex-row items-center'>
                <Text className='mr-3 text-sm' style={{ color: theme.colors.textSecondary }}>Status:</Text>
                <TouchableOpacity
                    className='flex-row items-center rounded-lg border px-3 py-2'
                    style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundTertiary }}
                    onPress={() => setOpen(!open)}
                    disabled={saving}
                >
                    {saving ? (
                        <Spinner size='small' color={theme.colors.primary} />
                    ) : (
                        <Text className='mr-3 text-sm font-semibold' style={{ color: statusColors[status]?.text ?? theme.colors.textPrimary }}>{statusLabels[status] ?? status}</Text>
                    )}
                    <AntDesign name='down' size={12} color={theme.colors.iconMuted} />
                </TouchableOpacity>
            </View>
            {open && (
                <View className='mt-2 self-start rounded-xl border' style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundTertiary }}>
                    {STATUSES.map((option) => (
                        <TouchableOpacity
                            key={option}
                            className='min-w-[160px] flex-row items-center px-4 py-3'
                            onPress={() => {
                                setOpen(false);
                                if(option !== status) onChange(option);
                            }}
                        >
                            <View className='h-2.5 w-2.5 rounded-sm' style={{ backgroundColor: statusColors[option].text }} />
                            <Text className='ml-2 flex-1 text-sm' style={{ color: theme.colors.textPrimary }}>{statusLabels[option]}</Text>
                            {option === status && <AntDesign name='check' size={14} color={theme.colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const InstructionRow: FC<{ index: number; instruction: Instruction; busy: boolean; isLast: boolean; onToggle: () => void }> = ({ index, instruction, busy, isLast, onToggle }) => (
    <View className={`flex-row items-center px-3 py-3 ${isLast ? '' : 'border-b'}`} style={{ borderColor: theme.colors.border }}>
        <Text className='w-6 text-sm font-bold' style={{ color: theme.colors.textSecondary }}>{index + 1}</Text>
        <TouchableOpacity
            className='mr-3 h-6 w-6 items-center justify-center rounded-full border-2'
            style={{ borderColor: instruction.complete ? theme.colors.success : theme.colors.textMuted, backgroundColor: instruction.complete ? theme.colors.success : 'transparent' }}
            onPress={onToggle}
            disabled={busy}
            hitSlop={8}
        >
            {busy ? <Spinner size='small' color={theme.colors.textPrimary} /> : instruction.complete && <AntDesign name='check' size={12} color={theme.colors.backgroundSecondary} />}
        </TouchableOpacity>
        <View className='mr-2 flex-1'>
            <Text className='text-sm font-bold' style={{ color: theme.colors.textPrimary, textDecorationLine: instruction.complete ? 'line-through' : 'none' }}>{instruction.title}</Text>
            {instruction.note ? <Text className='mt-0.5 text-xs' style={{ color: theme.colors.textSecondary }}>{instruction.note}</Text> : null}
        </View>
        <StatusBadge status={instruction.status} />
    </View>
);

const EmptyText: FC<{ message: string }> = ({ message }) => (
    <Text className='py-6 text-center text-sm' style={{ color: theme.colors.textMuted }}>{message}</Text>
);

const PunchItem: FC<Props> = ({ route, navigation }) => {
    const { id } = route.params;
    const { fetchTask, updateTask, fetchInstructions, createInstruction, updateInstruction } = usePunchTasks();
    const toast = useToast();
    const [toastId, setToastId] = useState(0);

    const [task, setTask] = useState<PunchTask | null>(null);
    const [jobName, setJobName] = useState('');
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<Tab>('details');
    const [savingStatus, setSavingStatus] = useState(false);
    const [busyIds, setBusyIds] = useState<string[]>([]);
    const [markingAll, setMarkingAll] = useState(false);
    const [addingStep, setAddingStep] = useState(false);

    const completedCount = instructions.filter((instruction) => instruction.complete).length;
    const canMarkAll = instructions.length > 0 && completedCount < instructions.length && !markingAll;

    const loadPunchItem = async () => {
        const [taskRes, instructionRes] = await Promise.all([fetchTask(id), fetchInstructions(id)]);
        const error = taskRes.error ?? instructionRes.error;
        if(error){
            showErrorToast({ description: error, toast, toastId, setToastId });
            return null
        }

        return { task: taskRes.task, jobName: taskRes.job?.name ?? '', instructions: instructionRes.instructions ?? [] };
    };

    const applyPunchItem = (result: Awaited<ReturnType<typeof loadPunchItem>>) => {
        if(!result) return;
        setTask(result.task);
        setJobName(result.jobName);
        setInstructions(result.instructions);
    };

    useEffect(() => {
        let cancelled = false;
        loadPunchItem().then((result) => {
            if(cancelled) return;
            applyPunchItem(result);
            setReady(true);
        });
        return () => { cancelled = true };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleRefresh = async () => {
        setLoading(true);
        applyPunchItem(await loadPunchItem());
        setLoading(false);
    };

    const handleStatus = async (status: PunchStatus) => {
        setSavingStatus(true);
        const res = await updateTask(id, { status });
        if(res.error){
            showErrorToast({ description: res.error, toast, toastId, setToastId });
            setSavingStatus(false);
            return
        }

        if(res.task) setTask(res.task);
        setSavingStatus(false);
    };

    // optimistic toggle, reverted if the request fails
    const handleToggle = async (instruction: Instruction) => {
        const complete = !instruction.complete;
        setBusyIds((ids) => [...ids, instruction.id]);
        setInstructions((list) => list.map((item) => item.id === instruction.id ? { ...item, complete, status: complete ? 'Complete' : 'Open' } : item));

        const res = await updateInstruction(instruction.id, { complete });
        if(res.error){
            showErrorToast({ description: res.error, toast, toastId, setToastId });
            setInstructions((list) => list.map((item) => item.id === instruction.id ? instruction : item));
        }else if(res.instruction){
            const updated = res.instruction;
            setInstructions((list) => list.map((item) => item.id === updated.id ? updated : item));
        }
        setBusyIds((ids) => ids.filter((busyId) => busyId !== instruction.id));
    };

    const handleMarkAll = async () => {
        setMarkingAll(true);
        const pending = instructions.filter((instruction) => !instruction.complete);
        const results = await Promise.all(pending.map((instruction) => updateInstruction(instruction.id, { complete: true })));

        const failed = results.find((res) => res.error);
        if(failed?.error) showErrorToast({ description: failed.error, toast, toastId, setToastId });

        const updated = results.flatMap((res) => res.instruction ? [res.instruction] : []);
        setInstructions((list) => list.map((item) => updated.find((instruction) => instruction.id === item.id) ?? item));

        // every step is done, so the punch item itself is complete
        if(!failed){
            const res = await updateTask(id, { status: 'Complete' });
            if(res.task) setTask(res.task);
            showToast({ description: 'All steps marked complete', toast, toastId, setToastId });
        }
        setMarkingAll(false);
    };

    const handleAddStep = async (step: { title: string; note: string }) => {
        const { values, error } = await yupValidate(newInstructionSchema, step);
        if(error || !values){
            showErrorToast({ description: error ?? 'Invalid step', toast, toastId, setToastId });
            return false;
        }

        const res = await createInstruction(id, { title: values.title.trim(), note: values.note?.trim() || undefined });
        if(res.error || !res.instruction){
            showErrorToast({ description: res.error ?? 'Could not add step', toast, toastId, setToastId });
            return false;
        }

        const instruction = res.instruction;
        setInstructions((list) => [...list, instruction]);
        return true;
    };

    if(!ready){
        return (
            <View className='flex-1 items-center justify-center' style={{ backgroundColor: theme.colors.backgroundSecondary }}>
                <Spinner size='large' color={theme.colors.primary} />
            </View>
        );
    }

    if(!task){
        return (
            <View className='flex-1 items-center justify-center px-6' style={{ backgroundColor: theme.colors.backgroundSecondary }}>
                <Text className='text-base' style={{ color: theme.colors.textSecondary }}>This punch item could not be loaded.</Text>
                <TouchableOpacity className={`${styles.button} mt-4`} style={{ backgroundColor: theme.colors.primary }} onPress={navigation.goBack}>
                    <Text className={styles.buttonText} style={{ color: theme.colors.primaryForeground }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isOverdue = isPastDue(task);
    const attachmentCount = task.media.length + task.attachments.length;
    const activity = [
        { key: 'created', icon: 'plus' as const, text: 'Punch item created', at: task.createdAt },
        ...instructions.filter((instruction) => instruction.complete).map((instruction) => ({ key: instruction.id, icon: 'check-circle' as const, text: `Completed: ${instruction.title}`, at: instruction.updatedAt })),
        ...(task.updatedAt !== task.createdAt ? [{ key: 'updated', icon: 'edit' as const, text: `Last updated · ${statusLabels[task.status] ?? task.status}`, at: task.updatedAt }] : []),
    ].sort((a, b) => b.at.localeCompare(a.at));

    return (
        <View className='flex-1' style={{ backgroundColor: theme.colors.backgroundSecondary }}>
            <ScrollView
                className='px-4'
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
                keyboardShouldPersistTaps='handled'
                refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
            >
                <View className='mb-4 flex-row items-start justify-between'>
                    <TouchableOpacity className='flex-row items-center py-1' onPress={navigation.goBack}>
                        <AntDesign name='arrow-left' size={18} color={theme.colors.textPrimary} />
                        <Text className='ml-2 text-base font-semibold' style={{ color: theme.colors.textPrimary }}>Back to Home</Text>
                    </TouchableOpacity>
                    <View className='items-end'>
                        <Text className='text-xs' style={{ color: theme.colors.textSecondary }}>Added on {formatDate(task.createdAt)}</Text>
                        <Text className='text-xs' style={{ color: theme.colors.textSecondary }}>at {formatTime(task.createdAt)}</Text>
                    </View>
                </View>

                <View className={styles.card} style={cardStyle}>
                    <View className='flex-row'>
                        <View className='h-20 w-20 items-center justify-center rounded-xl' style={{ backgroundColor: theme.colors.backgroundTertiary }}>
                            <AntDesign name='arrow-right' size={44} color={theme.colors.primary} />
                        </View>
                        <View className='ml-4 flex-1'>
                            <Text className={styles.label} style={{ color: theme.colors.textMuted }}>Punch Item</Text>
                            <Text className='mt-0.5 text-2xl font-black' style={{ color: theme.colors.textPrimary }}>{task.name}</Text>
                            <View className='mt-2 self-start rounded-md px-2.5 py-1' style={{ backgroundColor: theme.colors.primaryMuted }}>
                                <Text className='text-xs font-bold' style={{ color: theme.colors.primary }}>ID: {task.punchId}</Text>
                            </View>
                        </View>
                    </View>
                    <View className='mt-3'>
                        <DetailLine icon='environment' text={jobName} />
                        <DetailLine icon='calendar' text={`Due ${formatDate(task.dateDue)}${isOverdue ? ' · Overdue' : ''}`} color={isOverdue ? theme.colors.late : undefined} />
                        <DetailLine icon={task.visibility === 'template' ? 'team' : 'lock'} text={task.visibility === 'template' ? 'Template library · all projects' : 'Project members only'} />
                    </View>
                    {task.description ? <Text className='mt-3 text-sm leading-5' style={{ color: theme.colors.textSecondary }}>{task.description}</Text> : null}
                    {task.media.length > 0 && (
                        <View className='mt-4'>
                            <MediaGallery media={task.media} />
                        </View>
                    )}
                </View>

                <View className={styles.card} style={cardStyle}>
                    <TabBar active={tab} notes={task.notes.length} attachments={attachmentCount} onChange={setTab} />

                    {tab === 'details' && (
                        <>
                            <StatusSelect status={task.status} saving={savingStatus} onChange={handleStatus} />

                            <View className='mt-4 overflow-hidden rounded-xl border' style={{ borderColor: theme.colors.border }}>
                                <View className='flex-row px-3 py-3' style={{ backgroundColor: theme.colors.backgroundTertiary }}>
                                    <Text className={`w-6 ${styles.label}`} style={{ color: theme.colors.textPrimary }}>#</Text>
                                    <Text className={`ml-9 flex-1 ${styles.label}`} style={{ color: theme.colors.textPrimary }}>Task / Item</Text>
                                    <Text className={styles.label} style={{ color: theme.colors.textPrimary }}>Status</Text>
                                </View>
                                {instructions.length ? instructions.map((instruction, index) => (
                                    <InstructionRow
                                        key={instruction.id}
                                        index={index}
                                        instruction={instruction}
                                        busy={busyIds.includes(instruction.id)}
                                        isLast={index === instructions.length - 1}
                                        onToggle={() => handleToggle(instruction)}
                                    />
                                )) : <EmptyText message='No steps yet. Add the first one below.' />}
                            </View>

                            {addingStep ? (
                                <AddStepForm onCancel={() => setAddingStep(false)} onSave={handleAddStep} />
                            ) : (
                                <TouchableOpacity className='mt-3 flex-row items-center self-start' onPress={() => setAddingStep(true)}>
                                    <AntDesign name='plus' size={14} color={theme.colors.primary} />
                                    <Text className='ml-1.5 text-sm font-semibold' style={{ color: theme.colors.primary }}>Add Step</Text>
                                </TouchableOpacity>
                            )}

                            <View className={`mt-4 ${styles.divider}`} style={{ backgroundColor: theme.colors.border }} />
                            <View className='mt-4 flex-row items-center justify-between'>
                                <Text className='text-sm' style={{ color: theme.colors.textSecondary }}>{completedCount} of {instructions.length} tasks completed</Text>
                                <TouchableOpacity
                                    className={styles.button}
                                    style={{ backgroundColor: canMarkAll ? theme.colors.primary : theme.colors.backgroundTertiary }}
                                    disabled={!canMarkAll}
                                    onPress={handleMarkAll}
                                >
                                    {markingAll ? (
                                        <Spinner size='small' color={theme.colors.primaryForeground} />
                                    ) : (
                                        <Text className={styles.buttonText} style={{ color: canMarkAll ? theme.colors.primaryForeground : theme.colors.textMuted }}>Mark All Complete</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {tab === 'notes' && (
                        task.notes.length ? (
                            <View className='mt-3'>
                                {task.notes.map((note, index) => (
                                    <View key={`${index}-${note}`} className='mt-2 flex-row rounded-xl border p-3' style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundTertiary }}>
                                        <AntDesign name='file-text' size={16} color={theme.colors.primary} style={{ marginTop: 2 }} />
                                        <Text className='ml-3 flex-1 text-sm leading-5' style={{ color: theme.colors.textPrimary }}>{note}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : <EmptyText message='No notes on this punch item.' />
                    )}

                    {tab === 'attachments' && (
                        attachmentCount ? (
                            <View className='mt-2'>
                                {task.media.map((item, index) => (
                                    <FileRow key={`media-${item.id}-${index}`} url={item.url} name={`${item.kind === 'video' ? 'Video' : 'Photo'} ${index + 1}`} icon={item.kind === 'video' ? 'video-camera' : 'picture'} />
                                ))}
                                {task.attachments.map((item, index) => (
                                    <FileRow key={`file-${item.id}-${index}`} url={item.url} name={item.name} />
                                ))}
                            </View>
                        ) : <EmptyText message='No attachments on this punch item.' />
                    )}

                    {tab === 'activity' && (
                        <View className='mt-3'>
                            {activity.map((event, index) => (
                                <View key={event.key} className='flex-row'>
                                    <View className='items-center'>
                                        <View className='mt-3 h-8 w-8 items-center justify-center rounded-full' style={{ backgroundColor: theme.colors.backgroundTertiary }}>
                                            <AntDesign name={event.icon} size={14} color={theme.colors.primary} />
                                        </View>
                                        {index < activity.length - 1 && <View className='w-px flex-1' style={{ backgroundColor: theme.colors.border }} />}
                                    </View>
                                    <View className='ml-3 flex-1 pb-2 pt-3'>
                                        <Text className='text-sm font-semibold' style={{ color: theme.colors.textPrimary }}>{event.text}</Text>
                                        <Text className='text-xs' style={{ color: theme.colors.textMuted }}>{timeAgo(event.at)} · {formatDate(event.at)}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default PunchItem;
