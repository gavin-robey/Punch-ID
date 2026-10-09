import { theme } from '@/utils/theme';
import { FC, ReactNode, useEffect, useState } from 'react';
import { Image, Platform, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AntDesign } from '@react-native-vector-icons/ant-design';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Input, InputField } from '@/components/ui/input';
import { runAxiosAsync } from '@/api/runAxiosAsync';
import asyncStorage, { Keys } from '@/utils/asyncStorage';
import { yupValidate } from '@/utils/validator';
import useClient from '@/hooks/useClient';
import useJobs from '@/hooks/useJobs';
import { newInstructionSchema, newTaskSchema } from '@/validation/job';
import { AppStackParamList } from '@/navigator/app/AppNavigator';
import JobSelect from '@/components/JobSelect';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { showErrorToast } from '@/components/ErrorToast';
import { showToast } from '@/components/Toast';
import AddStepForm from '@/components/AddStepForm';

type PickedFile = { uri: string; name: string; mimeType?: string; size?: number; file?: File };
type Visibility = 'project' | 'template';
type StepDraft = { title: string; note: string };

const MAX_FILE_SIZE = 100 * 1024 * 1024; // cloudinary's single request upload limit
const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // the server's upload parser limit for one request
const MAX_FILES = 10; // per section, matches the server

const VISIBILITY_OPTIONS: { value: Visibility; label: string; subtitle: string }[] = [
    { value: 'project', label: 'Project Only', subtitle: 'Only visible to project members' },
    { value: 'template', label: 'All Projects (Template Library)', subtitle: 'Make available as a template for all projects' },
];

const styles = {
    card: `mb-4 rounded-2xl border p-4`,
    stepTitle: `text-base font-extrabold uppercase tracking-wide`,
    stepSubtitle: `mb-3 mt-1 text-sm`,
    label: `mb-2 text-xs font-bold uppercase`,
    input: `rounded-xl border bg-transparent`,
    button: `flex-row items-center justify-center rounded-lg px-4 py-3.5`,
    buttonText: `text-base font-bold`,
};

const cardStyle = { backgroundColor: theme.colors.backgroundPrimary, borderColor: theme.colors.border };
const inputStyle = { borderColor: theme.colors.border };
const inputTextStyle = { color: theme.colors.textPrimary };

// due dates travel as YYYY-MM-DD strings (what the server validates), the pickers work with Date objects
const toDateString = (date: Date) => {
    const pad = (value: number) => `${value}`.padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseDateString = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? new Date() : date;
};

const defaultDueDate = () => toDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

const formatFileSize = (bytes?: number) => {
    if(!bytes) return '';
    if(bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Step: FC<{ title: string; subtitle?: string; children: ReactNode }> = ({ title, subtitle, children }) => (
    <View className={styles.card} style={cardStyle}>
        <Text className={styles.stepTitle} style={{ color: theme.colors.textPrimary }}>{title}</Text>
        {subtitle ? <Text className={styles.stepSubtitle} style={{ color: theme.colors.textSecondary }}>{subtitle}</Text> : <View className='mb-3' />}
        {children}
    </View>
);

// one section of the upload media card: header with count and an add button, then its items
const UploadSection: FC<{ icon: 'picture' | 'file-text' | 'paper-clip'; title: string; count: number; actionLabel: string; onAction?: () => void; children: ReactNode }> = ({ icon, title, count, actionLabel, onAction, children }) => (
    <View className='mb-3 rounded-xl border p-3' style={{ borderColor: theme.colors.border }}>
        <View className='mb-2 flex-row items-center'>
            <AntDesign name={icon} size={20} color={theme.colors.primary} />
            <Text className='ml-2 flex-1 text-sm font-bold' style={{ color: theme.colors.textPrimary }}>
                {title} <Text style={{ color: theme.colors.textMuted }}>({count})</Text>
            </Text>
            {onAction && (
                <TouchableOpacity className='flex-row items-center rounded-lg px-3 py-1.5' style={{ backgroundColor: theme.colors.primaryMuted }} onPress={onAction}>
                    <AntDesign name='plus' size={12} color={theme.colors.primary} />
                    <Text className='ml-1 text-xs font-bold' style={{ color: theme.colors.primary }}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
        {children}
    </View>
);

const EmptyUpload: FC<{ message: string }> = ({ message }) => (
    <View className='items-center rounded-lg border border-dashed py-4' style={{ borderColor: theme.colors.border }}>
        <Text className='text-xs' style={{ color: theme.colors.textMuted }}>{message}</Text>
    </View>
);

const RemoveButton: FC<{ onPress: () => void; floating?: boolean }> = ({ onPress, floating }) => (
    <TouchableOpacity
        className={`h-6 w-6 items-center justify-center rounded-full ${floating ? 'absolute right-1 top-1' : 'ml-2'}`}
        style={{ backgroundColor: floating ? theme.colors.overlay : theme.colors.backgroundSecondary }}
        onPress={onPress}
        hitSlop={6}
    >
        <AntDesign name='close' size={12} color={theme.colors.textPrimary} />
    </TouchableOpacity>
);

const MediaTile: FC<{ item: PickedFile; onRemove: () => void }> = ({ item, onRemove }) => (
    <View className='mb-2 aspect-square w-[31.5%] items-center justify-center overflow-hidden rounded-lg' style={{ backgroundColor: theme.colors.backgroundTertiary }}>
        {item.mimeType?.startsWith('video') ? (
            <>
                <AntDesign name='play-circle' size={28} color={theme.colors.primary} />
                <Text className='mt-1 px-1 text-[10px]' style={{ color: theme.colors.textMuted }} numberOfLines={1}>{item.name}</Text>
            </>
        ) : (
            <Image source={{ uri: item.uri }} className='h-full w-full' resizeMode='cover' />
        )}
        <RemoveButton floating onPress={onRemove} />
    </View>
);

const ListRow: FC<{ icon: 'file-text' | 'paper-clip'; title: string; subtitle?: string; onRemove: () => void }> = ({ icon, title, subtitle, onRemove }) => (
    <View className='mb-2 flex-row items-center rounded-lg p-2.5' style={{ backgroundColor: theme.colors.backgroundTertiary }}>
        <AntDesign name={icon} size={16} color={theme.colors.iconMuted} />
        <View className='ml-2.5 flex-1'>
            <Text className='text-sm' style={{ color: theme.colors.textPrimary }} numberOfLines={subtitle ? 1 : 3}>{title}</Text>
            {subtitle ? <Text className='text-xs' style={{ color: theme.colors.textMuted }}>{subtitle}</Text> : null}
        </View>
        <RemoveButton onPress={onRemove} />
    </View>
);

const RadioOption: FC<{ label: string; subtitle: string; selected: boolean; onPress: () => void }> = ({ label, subtitle, selected, onPress }) => (
    <TouchableOpacity className='mb-3 flex-row' onPress={onPress}>
        <View className='mt-0.5 h-5 w-5 items-center justify-center rounded-full border-2' style={{ borderColor: selected ? theme.colors.primary : theme.colors.textMuted }}>
            {selected && <View className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: theme.colors.primary }} />}
        </View>
        <View className='ml-3 flex-1'>
            <Text className='text-sm font-bold' style={{ color: theme.colors.textPrimary }}>{label}</Text>
            <Text className='text-xs' style={{ color: theme.colors.textSecondary }}>{subtitle}</Text>
        </View>
    </TouchableOpacity>
);

const DueDatePicker: FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
    const date = parseDateString(value);
    const label = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    // the native picker has no web implementation, so web keeps a plain text field
    if(Platform.OS === 'web'){
        return (
            <Input className={styles.input} style={inputStyle}>
                <View className='pl-3'>
                    <AntDesign name='calendar' size={16} color={theme.colors.iconMuted} />
                </View>
                <InputField placeholder='YYYY-MM-DD' placeholderTextColor={theme.colors.textMuted} value={value} onChangeText={onChange} style={inputTextStyle} />
            </Input>
        );
    }

    if(Platform.OS === 'ios'){
        return (
            <View className='flex-row items-center rounded-xl border px-3 py-1.5' style={inputStyle}>
                <AntDesign name='calendar' size={16} color={theme.colors.iconMuted} />
                <Text className='ml-2 flex-1 text-sm' style={inputTextStyle}>{label}</Text>
                <DateTimePicker
                    value={date}
                    mode='date'
                    display='compact'
                    minimumDate={new Date()}
                    themeVariant='dark'
                    accentColor={theme.colors.primary}
                    onValueChange={(_, selected) => onChange(toDateString(selected))}
                />
            </View>
        );
    }

    return (
        <TouchableOpacity
            className='flex-row items-center rounded-xl border px-3 py-3'
            style={inputStyle}
            onPress={() => DateTimePickerAndroid.open({
                value: date,
                mode: 'date',
                minimumDate: new Date(),
                onValueChange: (_, selected) => onChange(toDateString(selected)),
            })}
        >
            <AntDesign name='calendar' size={16} color={theme.colors.iconMuted} />
            <Text className='ml-2 flex-1 text-sm' style={inputTextStyle}>{label}</Text>
            <AntDesign name='down' size={12} color={theme.colors.iconMuted} />
        </TouchableOpacity>
    );
};

const AddPunchItem: FC = () => {
    const { navigate, goBack } = useNavigation<NavigationProp<AppStackParamList>>();
    const { authClient } = useClient();
    const { currentJob, fetchJobs } = useJobs();
    const toast = useToast();
    const [toastId, setToastId] = useState(0);

    const [code, setCode] = useState('');
    const [media, setMedia] = useState<PickedFile[]>([]);
    const [notes, setNotes] = useState<string[]>([]);
    const [noteDraft, setNoteDraft] = useState('');
    const [attachments, setAttachments] = useState<PickedFile[]>([]);
    const [steps, setSteps] = useState<StepDraft[]>([]);
    const [addingStep, setAddingStep] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dateDue, setDateDue] = useState(defaultDueDate);
    const [visibility, setVisibility] = useState<Visibility>('project');
    const [loading, setLoading] = useState(false);

    const canSubmit = Boolean(currentJob && code.trim() && title.trim() && !loading);

    useEffect(() => {
        fetchJobs().then(({ error }) => {
            if(error) showErrorToast({ description: error, toast, toastId, setToastId });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetForm = () => {
        setCode('');
        setMedia([]);
        setNotes([]);
        setNoteDraft('');
        setAttachments([]);
        setSteps([]);
        setAddingStep(false);
        setTitle('');
        setDescription('');
        setDateDue(defaultDueDate());
        setVisibility('project');
    };

    // drops files over the per-file limit and anything past the section limit, with a toast explaining why
    const keepAllowed = (current: PickedFile[], picked: PickedFile[]) => {
        const sized = picked.filter((file) => !file.size || file.size <= MAX_FILE_SIZE);
        const allowed = sized.slice(0, Math.max(MAX_FILES - current.length, 0));
        if(sized.length < picked.length) showErrorToast({ description: 'Files must be 100MB or smaller', toast, toastId, setToastId });
        else if(allowed.length < sized.length) showErrorToast({ description: `Up to ${MAX_FILES} files per section`, toast, toastId, setToastId });
        return [...current, ...allowed];
    };

    const handleAddMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            selectionLimit: MAX_FILES - media.length,
            quality: 0.8,
        });
        if(result.canceled) return;

        const picked = result.assets.map((asset, index) => {
            const isVideo = asset.type === 'video';
            return {
                uri: asset.uri,
                name: asset.fileName ?? `${isVideo ? 'video' : 'photo'}-${Date.now()}-${index}.${isVideo ? 'mp4' : 'jpg'}`,
                mimeType: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
                size: asset.fileSize,
                file: asset.file,
            };
        });
        setMedia((current) => keepAllowed(current, picked));
    };

    const handleAddAttachments = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            multiple: true,
            copyToCacheDirectory: true,
        });
        if(result.canceled) return;

        const picked = result.assets.map((asset) => ({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size, file: asset.file }));
        setAttachments((current) => keepAllowed(current, picked));
    };

    const handleAddNote = () => {
        if(!noteDraft.trim()) return;
        setNotes((current) => [...current, noteDraft.trim()]);
        setNoteDraft('');
    };

    // steps are kept locally and sent with the punch item, so this only validates
    const handleAddStep = async (step: StepDraft) => {
        const { values, error } = await yupValidate(newInstructionSchema, step);
        if(error || !values){
            showErrorToast({ description: error ?? 'Invalid step', toast, toastId, setToastId });
            return false;
        }

        setSteps((current) => [...current, { title: values.title.trim(), note: values.note?.trim() ?? '' }]);
        return true;
    };

    const handleSubmit = async () => {
        setLoading(true);
        const { values, error } = await yupValidate(newTaskSchema, {
            id: currentJob?.id ?? '',
            punchId: code,
            name: title,
            description,
            dateDue,
            visibility,
        });

        if(error || !values){
            showErrorToast({ description: error ?? 'Invalid punch item', toast, toastId, setToastId });
            setLoading(false);
            return
        }

        const totalSize = [...media, ...attachments].reduce((sum, file) => sum + (file.size ?? 0), 0);
        if(totalSize > MAX_TOTAL_SIZE){
            showErrorToast({ description: 'Uploads must total 200MB or less', toast, toastId, setToastId });
            setLoading(false);
            return
        }

        // multipart so the server's fileParser receives every file, lists travel as JSON strings
        const formData = new FormData();
        formData.append('id', values.id);
        formData.append('name', values.name.trim());
        formData.append('dateDue', values.dateDue);
        formData.append('visibility', visibility);
        if(description.trim()) formData.append('description', description.trim());
        if(notes.length) formData.append('notes', JSON.stringify(notes));
        if(steps.length) formData.append('instructions', JSON.stringify(steps.map((step) => step.note ? step : { title: step.title })));
        // web returns a File object, native needs the { uri, name, type } shape
        const toUpload = (file: PickedFile) => (file.file ?? { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' }) as any;
        media.forEach((file) => formData.append('media', toUpload(file)));
        attachments.forEach((file) => formData.append('attachments', toUpload(file)));

        const accessToken = await asyncStorage.get(Keys.AUTH_TOKEN);
        const res = await runAxiosAsync<{ message: string }>(
            authClient.post(`job/create-task/${encodeURIComponent(values.punchId.trim())}`, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/form-data',
                }
            })
        );

        if(res.error){
            showErrorToast({ description: res.error, toast, toastId, setToastId });
            setLoading(false);
            return
        }

        if(res?.data){
            showToast({ description: res.data.message, toast, toastId, setToastId });
            resetForm();
        }
        setLoading(false);
    };

    return (
        <View className='flex-1' style={{ backgroundColor: theme.colors.backgroundSecondary }}>
            <ScrollView className='px-4' showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }} keyboardShouldPersistTaps='handled'>
                <View className='mb-5 flex-row items-start justify-between'>
                    <View className='flex-1 pr-3'>
                        <Text className='text-3xl font-black uppercase' style={{ color: theme.colors.textPrimary }}>Attach QR</Text>
                        <View className='mt-1 h-1 w-12 rounded-full' style={{ backgroundColor: theme.colors.primary }} />
                        <Text className='mt-3 text-sm' style={{ color: theme.colors.textSecondary }}>Upload and manage content that will be linked to an Arrow QR Code.</Text>
                    </View>
                    <TouchableOpacity className='flex-row items-center rounded-lg border px-3 py-2' style={cardStyle} onPress={() => navigate('Home')}>
                        <AntDesign name='arrow-left' size={14} color={theme.colors.textPrimary} />
                        <Text className='ml-2 text-sm font-semibold' style={{ color: theme.colors.textPrimary }}>Home</Text>
                    </TouchableOpacity>
                </View>

                <Step title='1. Job Site' subtitle='Select the job site this punch item belongs to.'>
                    <JobSelect allowAdd />
                </Step>

                <Step title='2. Register QR' subtitle='Enter the Arrow QR Code you want to attach content to. (text input until scan is fully implemented)'>
                    <View className='flex-row items-center rounded-xl border px-3 py-2' style={inputStyle}>
                        <View className='h-11 w-11 items-center justify-center rounded-lg' style={{ backgroundColor: theme.colors.backgroundTertiary }}>
                            <AntDesign name='arrow-right' size={24} color={theme.colors.primary} />
                        </View>
                        <View className='ml-3 flex-1'>
                            {/* TODO: replace with the scanner once the Scan screen is built */}
                            <Input className='h-8 border-0 bg-transparent'>
                                <InputField
                                    className='px-0 font-bold'
                                    placeholder='Enter QR Code'
                                    placeholderTextColor={theme.colors.textSecondary}
                                    autoCapitalize='characters'
                                    value={code}
                                    onChangeText={setCode}
                                    style={inputTextStyle}
                                />
                            </Input>
                        </View>
                        <AntDesign name='qrcode' size={20} color={theme.colors.iconMuted} />
                    </View>
                </Step>

                <Step title='3. Content Details' subtitle='Add a title and description for this content.'>
                    <Text className={styles.label} style={{ color: theme.colors.textSecondary }}>
                        Title <Text style={{ color: theme.colors.primary }}>*</Text>
                    </Text>
                    <Input className={`${styles.input} mb-4`} style={inputStyle}>
                        <InputField placeholder='Enter a descriptive title' placeholderTextColor={theme.colors.textMuted} value={title} onChangeText={setTitle} style={inputTextStyle} />
                    </Input>

                    <Text className={styles.label} style={{ color: theme.colors.textSecondary }}>Description (Optional)</Text>
                    <Input className={`${styles.input} mb-4 h-24`} style={inputStyle}>
                        <InputField
                            placeholder='Add a description (optional)'
                            placeholderTextColor={theme.colors.textMuted}
                            multiline
                            textAlignVertical='top'
                            className='py-3'
                            value={description}
                            onChangeText={setDescription}
                            style={inputTextStyle}
                        />
                    </Input>

                    <Text className={styles.label} style={{ color: theme.colors.textSecondary }}>
                        Due Date <Text style={{ color: theme.colors.primary }}>*</Text>
                    </Text>
                    <DueDatePicker value={dateDue} onChange={setDateDue} />
                </Step>

                <Step title='4. Upload Media' subtitle='Add any photos, videos, notes and files for this QR code.'>
                    <UploadSection icon='picture' title='Photos & Videos' count={media.length} actionLabel='Camera Roll' onAction={media.length < MAX_FILES ? handleAddMedia : undefined}>
                        {media.length ? (
                            <View className='flex-row flex-wrap justify-between'>
                                {media.map((item, index) => (
                                    <MediaTile key={`${item.uri}-${index}`} item={item} onRemove={() => setMedia((current) => current.filter((_, i) => i !== index))} />
                                ))}
                                {/* keeps the last row left aligned */}
                                {media.length % 3 === 2 && <View className='w-[31.5%]' />}
                            </View>
                        ) : <EmptyUpload message='Photos or videos up to 100MB each' />}
                    </UploadSection>

                    <UploadSection icon='file-text' title='Notes' count={notes.length} actionLabel='Add Note' onAction={noteDraft.trim() ? handleAddNote : undefined}>
                        {notes.map((note, index) => (
                            <ListRow key={`${index}-${note}`} icon='file-text' title={note} onRemove={() => setNotes((current) => current.filter((_, i) => i !== index))} />
                        ))}
                        <Input className={`${styles.input} h-20`} style={inputStyle}>
                            <InputField
                                placeholder='e.g. Outlet cover cracked, replace with white decora cover'
                                placeholderTextColor={theme.colors.textMuted}
                                multiline
                                textAlignVertical='top'
                                className='py-2'
                                value={noteDraft}
                                onChangeText={setNoteDraft}
                                style={inputTextStyle}
                            />
                        </Input>
                    </UploadSection>

                    <UploadSection icon='paper-clip' title='Attachments' count={attachments.length} actionLabel='Browse Files' onAction={attachments.length < MAX_FILES ? handleAddAttachments : undefined}>
                        {attachments.length ? attachments.map((file, index) => (
                            <ListRow key={`${file.uri}-${index}`} icon='paper-clip' title={file.name} subtitle={formatFileSize(file.size)} onRemove={() => setAttachments((current) => current.filter((_, i) => i !== index))} />
                        )) : <EmptyUpload message='PDFs, spec sheets or any file up to 100MB' />}
                    </UploadSection>
                </Step>

                <Step title='5. Instruction Steps' subtitle='Break the work into steps the crew can check off.'>
                    <View className='overflow-hidden rounded-xl border' style={{ borderColor: theme.colors.border }}>
                        <View className='flex-row px-3 py-3' style={{ backgroundColor: theme.colors.backgroundTertiary }}>
                            <Text className='w-6 text-xs font-bold uppercase' style={{ color: theme.colors.textPrimary }}>#</Text>
                            <Text className='flex-1 text-xs font-bold uppercase' style={{ color: theme.colors.textPrimary }}>Task / Item</Text>
                        </View>
                        {steps.length ? steps.map((step, index) => (
                            <View key={`${index}-${step.title}`} className={`flex-row items-center px-3 py-3 ${index === steps.length - 1 ? '' : 'border-b'}`} style={{ borderColor: theme.colors.border }}>
                                <Text className='w-6 text-sm font-bold' style={{ color: theme.colors.textSecondary }}>{index + 1}</Text>
                                <View className='flex-1'>
                                    <Text className='text-sm font-bold' style={{ color: theme.colors.textPrimary }}>{step.title}</Text>
                                    {step.note ? <Text className='mt-0.5 text-xs' style={{ color: theme.colors.textSecondary }}>{step.note}</Text> : null}
                                </View>
                                <RemoveButton onPress={() => setSteps((current) => current.filter((_, i) => i !== index))} />
                            </View>
                        )) : (
                            <Text className='py-5 text-center text-sm' style={{ color: theme.colors.textMuted }}>No steps yet.</Text>
                        )}
                    </View>

                    {addingStep ? (
                        <AddStepForm onCancel={() => setAddingStep(false)} onSave={handleAddStep} />
                    ) : (
                        <TouchableOpacity className='mt-3 flex-row items-center self-start' onPress={() => setAddingStep(true)}>
                            <AntDesign name='plus' size={14} color={theme.colors.primary} />
                            <Text className='ml-1.5 text-sm font-semibold' style={{ color: theme.colors.primary }}>Add Step</Text>
                        </TouchableOpacity>
                    )}
                </Step>

                <Step title='6. Visibility' subtitle='Choose who can view this content.'>
                    {VISIBILITY_OPTIONS.map((option) => (
                        <RadioOption key={option.value} label={option.label} subtitle={option.subtitle} selected={visibility === option.value} onPress={() => setVisibility(option.value)} />
                    ))}
                    <View className='mt-1 flex-row rounded-xl border p-3' style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundTertiary }}>
                        <AntDesign name='info-circle' size={16} color={theme.colors.info} style={{ marginTop: 2 }} />
                        <Text className='ml-3 flex-1 text-xs leading-5' style={{ color: theme.colors.textSecondary }}>
                            This content will be linked to the selected QR item. Anyone who scans this QR code will be able to view it.
                        </Text>
                    </View>
                </Step>

                <View className='flex-row justify-end'>
                    <TouchableOpacity className={`${styles.button} mr-3 border`} style={{ borderColor: theme.colors.border }} onPress={goBack}>
                        <Text className={styles.buttonText} style={{ color: theme.colors.textPrimary }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`${styles.button} flex-1`}
                        style={{ backgroundColor: canSubmit ? theme.colors.primary : theme.colors.backgroundTertiary }}
                        disabled={!canSubmit}
                        onPress={handleSubmit}
                    >
                        {loading ? (
                            <Spinner size='small' color={theme.colors.primaryForeground} />
                        ) : (
                            <>
                                <AntDesign name='qrcode' size={18} color={canSubmit ? theme.colors.primaryForeground : theme.colors.textMuted} />
                                <Text className={`ml-2 ${styles.buttonText}`} style={{ color: canSubmit ? theme.colors.primaryForeground : theme.colors.textMuted }}>Attach to QR</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

        </View>
    );
};

export default AddPunchItem;
